import Ably from 'ably'

interface User {
  id: string
  name: string
  role: 'participant' | 'spectator'
  isHost: boolean
}

interface PendingUser {
  id: string
  name: string
  role: 'participant' | 'spectator'
  socketId: string
}

interface Issue {
  id: string
  title: string
  description: string
  votes: Record<string, number>
  isCompleted: boolean
  finalEstimate?: number
}

interface RoomData {
  name: string
  users: User[]
  pendingUsers: PendingUser[]
  currentIssue: Issue | null
  issues: Issue[]
  votes: Record<string, number>
  votingRevealed: boolean
}

export class AblyService {
  private client: Ably.Realtime | null = null
  private rooms: Record<string, RoomData> = {}
  private currentUser: User | null = null
  private currentRoomId: string | null = null

  constructor() {
    this.initializeClient()
  }

  getClientId(): string {
    return this.client?.auth.clientId || ''
  }

  private initializeClient() {
    const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY
    if (!apiKey) {
      console.error('Ably API key not found in environment variables')
      return
    }

    try {
      this.client = new Ably.Realtime({
        key: apiKey,
        clientId: Math.random().toString(36).substring(2, 15)
      })

      this.client.connection.on('connected', () => {
        console.log('Connected to Ably')
      })

      this.client.connection.on('disconnected', () => {
        console.log('Disconnected from Ably')
      })

      this.client.connection.on('failed', (error) => {
        console.error('Ably connection failed:', error)
        // Fallback to local mode
        this.client = null
      })
    } catch (error) {
      console.error('Failed to initialize Ably client:', error)
      this.client = null
    }
  }

  async joinRoom(roomId: string, user: User, roomName?: string): Promise<void> {
    if (!this.client) {
      this.initializeClient()
    }

    this.currentRoomId = roomId
    const userId = this.client?.auth.clientId || Math.random().toString(36).substring(2, 15)
    const userWithId = { ...user, id: userId }
    
    // Only update currentUser if this is the actual user joining (not when processing other users)
    // We identify this by checking if the user has isHost=true or if there's no host yet
    const hasHost = this.rooms[roomId]?.users.some(u => u.isHost)
    if (!hasHost || user.isHost) {
      this.currentUser = userWithId
    }

    // Initialize room if it doesn't exist
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = {
        name: roomName || `Room ${roomId}`,
        users: [],
        pendingUsers: [],
        currentIssue: null,
        issues: [],
        votes: {},
        votingRevealed: false
      }
    }

    // Check if user already exists
    const existingUserIndex = this.rooms[roomId].users.findIndex(u => u.name === userWithId.name)
    const isFirstUser = this.rooms[roomId].users.length === 0 && this.rooms[roomId].pendingUsers.length === 0

    if (existingUserIndex >= 0) {
      // User is reconnecting - update their client ID
      this.rooms[roomId].users[existingUserIndex] = {
        ...this.rooms[roomId].users[existingUserIndex],
        id: userWithId.id
      }
      if (this.client) {
        const channel = this.client.channels.get(`room:${roomId}`)
        await channel.publish('room-updated', this.rooms[roomId])
      } else {
        this.triggerRoomUpdateCallbacks(roomId)
      }
    } else if (isFirstUser) {
      // First user becomes host
      this.rooms[roomId].users.push({ ...userWithId, isHost: true })
      if (this.client) {
        const channel = this.client.channels.get(`room:${roomId}`)
        await channel.publish('room-updated', this.rooms[roomId])
      } else {
        this.triggerRoomUpdateCallbacks(roomId)
      }
    } else {
      // Check if user is already in pending list
      const existingPendingIndex = this.rooms[roomId].pendingUsers.findIndex(u => u.name === userWithId.name)
      if (existingPendingIndex >= 0) {
        this.rooms[roomId].pendingUsers[existingPendingIndex].socketId = userWithId.id
        return
      }

      // Add user to pending list
      const pendingUser: PendingUser = {
        id: Math.random().toString(36).substring(2, 9),
        name: userWithId.name,
        role: userWithId.role,
        socketId: userWithId.id
      }

      this.rooms[roomId].pendingUsers.push(pendingUser)

      // Notify host about pending user
      const hostUser = this.rooms[roomId].users.find(u => u.isHost)
      if (hostUser) {
        if (this.client) {
          const channel = this.client.channels.get(`room:${roomId}`)
          await channel.publish('pending-user-request', { pendingUser })
        } else {
          console.log('Running in local mode - Ably not available')
          // Trigger approval callbacks for local mode
          this.triggerApprovalCallbacks({
            type: 'pending-request',
            pendingUser: pendingUser
          })
        }
      }
    }

    // Subscribe to room events only if Ably is available
    if (this.client) {
      this.subscribeToRoomEvents(roomId)
    } else {
      console.log('Running in local mode - Ably not available')
    }
    
    // Always trigger room update callbacks to ensure UI is updated
    setTimeout(() => {
      this.triggerRoomUpdateCallbacks(roomId)
    }, 100)
  }

  private subscribeToRoomEvents(roomId: string) {
    if (!this.client) return

    const channel = this.client.channels.get(`room:${roomId}`)

    channel.subscribe('approve-user', async (message) => {
      const { pendingUserId } = message.data
      if (!this.currentUser?.isHost) return

      const pendingUserIndex = this.rooms[roomId].pendingUsers.findIndex(u => u.id === pendingUserId)
      if (pendingUserIndex >= 0) {
        const pendingUser = this.rooms[roomId].pendingUsers[pendingUserIndex]
        
        const newUser: User = {
          id: pendingUser.socketId,
          name: pendingUser.name,
          role: pendingUser.role,
          isHost: false
        }
        
        this.rooms[roomId].users.push(newUser)
        this.rooms[roomId].pendingUsers.splice(pendingUserIndex, 1)
        
        await channel.publish('approval-granted', { userId: pendingUser.socketId })
        await channel.publish('room-updated', this.rooms[roomId])
      }
    })

    channel.subscribe('reject-user', async (message) => {
      const { pendingUserId } = message.data
      if (!this.currentUser?.isHost) return

      const pendingUserIndex = this.rooms[roomId].pendingUsers.findIndex(u => u.id === pendingUserId)
      if (pendingUserIndex >= 0) {
        const pendingUser = this.rooms[roomId].pendingUsers[pendingUserIndex]
        this.rooms[roomId].pendingUsers.splice(pendingUserIndex, 1)
        
        await channel.publish('approval-rejected', { 
          userId: pendingUser.socketId,
          message: 'Your request to join the room was rejected by the host.'
        })
        await channel.publish('room-updated', this.rooms[roomId])
      }
    })

    channel.subscribe('create-issue', async (message) => {
      const { issue } = message.data
      const newIssue: Issue = {
        ...issue,
        id: Math.random().toString(36).substring(2, 9),
        votes: {},
        isCompleted: false
      }
      
      this.rooms[roomId].issues.push(newIssue)
      if (!this.rooms[roomId].currentIssue) {
        this.rooms[roomId].currentIssue = newIssue
      }
      
      await channel.publish('room-updated', this.rooms[roomId])
    })

    channel.subscribe('edit-issue', async (message) => {
      const { issueId, updates } = message.data
      const issueIndex = this.rooms[roomId].issues.findIndex(i => i.id === issueId)
      
      if (issueIndex >= 0) {
        this.rooms[roomId].issues[issueIndex] = { ...this.rooms[roomId].issues[issueIndex], ...updates }
        if (this.rooms[roomId].currentIssue?.id === issueId) {
          this.rooms[roomId].currentIssue = this.rooms[roomId].issues[issueIndex]
        }
        await channel.publish('room-updated', this.rooms[roomId])
      }
    })

    channel.subscribe('delete-issue', async (message) => {
      const { issueId } = message.data
      this.rooms[roomId].issues = this.rooms[roomId].issues.filter(i => i.id !== issueId)
      
      if (this.rooms[roomId].currentIssue?.id === issueId) {
        this.rooms[roomId].currentIssue = this.rooms[roomId].issues[0] || null
      }
      
      await channel.publish('room-updated', this.rooms[roomId])
    })

    channel.subscribe('select-issue', async (message) => {
      const { issueId } = message.data
      if (!this.currentUser?.isHost) return

      const issue = this.rooms[roomId].issues.find(i => i.id === issueId)
      if (issue) {
        this.rooms[roomId].currentIssue = issue
        this.rooms[roomId].votes = {}
        this.rooms[roomId].votingRevealed = false
        await channel.publish('room-updated', this.rooms[roomId])
      }
    })

    channel.subscribe('vote', async (message) => {
      const { vote, userId } = message.data
      if (!this.rooms[roomId].currentIssue) return

      this.rooms[roomId].votes[userId] = vote
      
      const participants = this.rooms[roomId].users.filter(u => u.role === 'participant')
      const votedCount = Object.keys(this.rooms[roomId].votes).length
      
      if (votedCount === participants.length) {
        this.rooms[roomId].votingRevealed = true
        
        if (this.rooms[roomId].currentIssue) {
          const issueIndex = this.rooms[roomId].issues.findIndex(i => i.id === this.rooms[roomId].currentIssue!.id)
          if (issueIndex >= 0) {
            this.rooms[roomId].issues[issueIndex].votes = { ...this.rooms[roomId].votes }
          }
        }
      }
      
      await channel.publish('room-updated', this.rooms[roomId])
    })

    channel.subscribe('next-round', async (message) => {
      if (!this.rooms[roomId].currentIssue) return

      const votes = Object.values(this.rooms[roomId].votes)
      const allSame = votes.length > 0 && votes.every(v => v === votes[0])
      
      if (allSame) {
        const issueIndex = this.rooms[roomId].issues.findIndex(i => i.id === this.rooms[roomId].currentIssue!.id)
        if (issueIndex >= 0) {
          this.rooms[roomId].issues[issueIndex].isCompleted = true
          this.rooms[roomId].issues[issueIndex].finalEstimate = votes[0]
        }
        
        const nextIssue = this.rooms[roomId].issues.find(i => !i.isCompleted)
        this.rooms[roomId].currentIssue = nextIssue || null
        this.rooms[roomId].votes = {}
        this.rooms[roomId].votingRevealed = false
        
        await channel.publish('room-updated', this.rooms[roomId])
      }
    })
  }

  async approveUser(roomId: string, pendingUserId: string): Promise<void> {
    const room = this.rooms[roomId]
    if (!room) return

    const pendingUserIndex = room.pendingUsers.findIndex(u => u.id === pendingUserId)
    if (pendingUserIndex >= 0) {
      const pendingUser = room.pendingUsers[pendingUserIndex]
      
      // Add user to room
      const newUser: User = {
        id: pendingUser.socketId,
        name: pendingUser.name,
        role: pendingUser.role,
        isHost: false
      }
      
      room.users.push(newUser)
      room.pendingUsers.splice(pendingUserIndex, 1)
      
      if (this.client) {
        const channel = this.client.channels.get(`room:${roomId}`)
        await channel.publish('approval-granted', { userId: pendingUser.socketId })
        await channel.publish('room-updated', room)
      } else {
        // Trigger approval callbacks for local mode
        this.triggerApprovalCallbacks({
          type: 'granted',
          userId: pendingUser.socketId
        })
        // Trigger room update callbacks
        this.triggerRoomUpdateCallbacks(roomId)
      }
    }
  }

  async rejectUser(roomId: string, pendingUserId: string): Promise<void> {
    const room = this.rooms[roomId]
    if (!room) return

    const pendingUserIndex = room.pendingUsers.findIndex(u => u.id === pendingUserId)
    if (pendingUserIndex >= 0) {
      const pendingUser = room.pendingUsers[pendingUserIndex]
      room.pendingUsers.splice(pendingUserIndex, 1)
      
      if (this.client) {
        const channel = this.client.channels.get(`room:${roomId}`)
        await channel.publish('approval-rejected', { 
          userId: pendingUser.socketId,
          message: 'Your request to join the room was rejected by the host.'
        })
        await channel.publish('room-updated', room)
      } else {
        // Trigger approval callbacks for local mode
        this.triggerApprovalCallbacks({
          type: 'rejected',
          userId: pendingUser.socketId,
          message: 'Access denied'
        })
        // Trigger room update callbacks
        this.triggerRoomUpdateCallbacks(roomId)
      }
    }
  }

  async createIssue(roomId: string, issue: { title: string; description: string }): Promise<void> {
    if (!this.rooms[roomId]) return
    
    const newIssue: Issue = {
      id: Math.random().toString(36).substring(2, 15),
      title: issue.title,
      description: issue.description,
      votes: {},
      isCompleted: false
    }
    
    this.rooms[roomId].issues.push(newIssue)
    
    if (this.client) {
      const channel = this.client.channels.get(`room:${roomId}`)
      await channel.publish('create-issue', { issue })
    } else {
      this.triggerRoomUpdateCallbacks(roomId)
    }
  }

  async editIssue(roomId: string, issueId: string, updates: Partial<Issue>): Promise<void> {
    if (!this.rooms[roomId]) return
    
    const issueIndex = this.rooms[roomId].issues.findIndex(i => i.id === issueId)
    if (issueIndex >= 0) {
      this.rooms[roomId].issues[issueIndex] = {
        ...this.rooms[roomId].issues[issueIndex],
        ...updates
      }
      
      if (this.rooms[roomId].currentIssue?.id === issueId) {
        this.rooms[roomId].currentIssue = this.rooms[roomId].issues[issueIndex]
      }
    }
    
    if (this.client) {
      const channel = this.client.channels.get(`room:${roomId}`)
      await channel.publish('edit-issue', { issueId, updates })
    } else {
      this.triggerRoomUpdateCallbacks(roomId)
    }
  }

  async deleteIssue(roomId: string, issueId: string): Promise<void> {
    if (!this.rooms[roomId]) return
    
    this.rooms[roomId].issues = this.rooms[roomId].issues.filter(i => i.id !== issueId)
    
    if (this.rooms[roomId].currentIssue?.id === issueId) {
      this.rooms[roomId].currentIssue = null
      this.rooms[roomId].votes = {}
      this.rooms[roomId].votingRevealed = false
    }
    
    if (this.client) {
      const channel = this.client.channels.get(`room:${roomId}`)
      await channel.publish('delete-issue', { issueId })
    } else {
      this.triggerRoomUpdateCallbacks(roomId)
    }
  }

  async selectIssue(roomId: string, issueId: string): Promise<void> {
    if (!this.rooms[roomId]) return
    
    const issue = this.rooms[roomId].issues.find(i => i.id === issueId)
    if (issue) {
      this.rooms[roomId].currentIssue = issue
      this.rooms[roomId].votes = {}
      this.rooms[roomId].votingRevealed = false
    }
    
    if (this.client) {
      const channel = this.client.channels.get(`room:${roomId}`)
      await channel.publish('select-issue', { issueId })
    } else {
      this.triggerRoomUpdateCallbacks(roomId)
    }
  }

  async vote(roomId: string, vote: number): Promise<void> {
    if (!this.currentUser || !this.rooms[roomId]) return
    
    this.rooms[roomId].votes[this.currentUser.id] = vote
    
    // Check if all participants have voted
    const participants = this.rooms[roomId].users.filter(u => u.role === 'participant')
    const votedCount = Object.keys(this.rooms[roomId].votes).length
    
    if (votedCount === participants.length) {
      this.rooms[roomId].votingRevealed = true
      
      if (this.rooms[roomId].currentIssue) {
        const issueIndex = this.rooms[roomId].issues.findIndex(i => i.id === this.rooms[roomId].currentIssue!.id)
        if (issueIndex >= 0) {
          this.rooms[roomId].issues[issueIndex].votes = { ...this.rooms[roomId].votes }
        }
      }
    }
    
    if (this.client) {
      const channel = this.client.channels.get(`room:${roomId}`)
      await channel.publish('vote', { vote, userId: this.client.auth.clientId })
    } else {
      this.triggerRoomUpdateCallbacks(roomId)
    }
  }

  async nextRound(roomId: string): Promise<void> {
    if (!this.rooms[roomId] || !this.rooms[roomId].currentIssue) return
    
    const votes = Object.values(this.rooms[roomId].votes)
    const allSame = votes.length > 0 && votes.every(v => v === votes[0])
    
    if (allSame) {
      const issueIndex = this.rooms[roomId].issues.findIndex(i => i.id === this.rooms[roomId].currentIssue!.id)
      if (issueIndex >= 0) {
        this.rooms[roomId].issues[issueIndex].isCompleted = true
        this.rooms[roomId].issues[issueIndex].finalEstimate = votes[0]
      }
      
      const nextIssue = this.rooms[roomId].issues.find(i => !i.isCompleted)
      this.rooms[roomId].currentIssue = nextIssue || null
    }
    
    this.rooms[roomId].votes = {}
    this.rooms[roomId].votingRevealed = false
    
    if (this.client) {
      const channel = this.client.channels.get(`room:${roomId}`)
      await channel.publish('next-round', {})
    } else {
      this.triggerRoomUpdateCallbacks(roomId)
    }
  }

  private roomUpdateCallbacks: Record<string, ((roomData: RoomData) => void)[]> = {}

  subscribeToRoomUpdates(roomId: string, callback: (roomData: RoomData) => void): () => void {
    // Store callback for local mode
    if (!this.roomUpdateCallbacks[roomId]) {
      this.roomUpdateCallbacks[roomId] = []
    }
    this.roomUpdateCallbacks[roomId].push(callback)

    let listener: any = null
    const channel = this.client?.channels.get(`room:${roomId}`)
    
    if (channel) {
      listener = (message: any) => {
        callback(message.data)
      }
      channel.subscribe('room-updated', listener)
    }

    return () => {
      // Remove callback from local storage
      if (this.roomUpdateCallbacks[roomId]) {
        const index = this.roomUpdateCallbacks[roomId].indexOf(callback)
        if (index > -1) {
          this.roomUpdateCallbacks[roomId].splice(index, 1)
        }
      }
      
      // Unsubscribe from Ably if available
      if (channel && listener) {
        channel.unsubscribe('room-updated', listener)
      }
    }
  }

  private triggerRoomUpdateCallbacks(roomId: string) {
    const callbacks = this.roomUpdateCallbacks[roomId] || []
    const roomData = this.rooms[roomId]
    if (roomData) {
      callbacks.forEach(callback => callback(roomData))
    }
  }

  private approvalCallbacks: ((data: any) => void)[] = []

  subscribeToApprovalEvents(callback: (data: any) => void): () => void {
    // Store callback for local mode
    this.approvalCallbacks.push(callback)
    
    if (this.client && this.currentRoomId) {
      const channel = this.client.channels.get(`room:${this.currentRoomId}`)
      
      const approvalGrantedListener = (message: any) => {
        if (message.data.userId === this.client?.auth.clientId) {
          callback({ type: 'granted' })
        }
      }

      const approvalRejectedListener = (message: any) => {
        if (message.data.userId === this.client?.auth.clientId) {
          callback({ type: 'rejected', message: message.data.message })
        }
      }

      const pendingRequestListener = (message: any) => {
        callback({ type: 'pending-request', pendingUser: message.data.pendingUser })
      }

      channel.subscribe('approval-granted', approvalGrantedListener)
      channel.subscribe('approval-rejected', approvalRejectedListener)
      channel.subscribe('pending-user-request', pendingRequestListener)

      return () => {
        // Remove callback from local storage
        const index = this.approvalCallbacks.indexOf(callback)
        if (index > -1) {
          this.approvalCallbacks.splice(index, 1)
        }
        
        // Unsubscribe from Ably if available
        channel.unsubscribe('approval-granted', approvalGrantedListener)
        channel.unsubscribe('approval-rejected', approvalRejectedListener)
        channel.unsubscribe('pending-user-request', pendingRequestListener)
      }
    }

    return () => {
      // Remove callback from local storage
      const index = this.approvalCallbacks.indexOf(callback)
      if (index > -1) {
        this.approvalCallbacks.splice(index, 1)
      }
    }
  }

  private triggerApprovalCallbacks(data: any) {
    this.approvalCallbacks.forEach(callback => callback(data))
  }

  disconnect(): void {
    if (this.client) {
      this.client.close()
      this.client = null
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  getRoomData(roomId: string): RoomData | null {
    return this.rooms[roomId] || null
  }
}

// Export the class instead of a singleton instance to avoid conflicts when testing multiple users in the same browser
export default AblyService
export type { User, PendingUser, Issue, RoomData }