import { NextApiRequest, NextApiResponse } from 'next'
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer
    }
  }
}

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

const rooms: Record<string, RoomData> = {}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    })
    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('User connected:', socket.id)

      socket.on('join-room', (data: { roomId: string; user: User; roomName?: string }) => {
        const { roomId, user, roomName } = data
        
        if (!rooms[roomId]) {
          rooms[roomId] = {
            name: roomName || `Room ${roomId}`,
            users: [],
            pendingUsers: [],
            currentIssue: null,
            issues: [],
            votes: {},
            votingRevealed: false
          }
        }

        const existingUserIndex = rooms[roomId].users.findIndex(u => u.id === socket.id)
        const isFirstUser = rooms[roomId].users.length === 0
        
        if (existingUserIndex >= 0) {
          // User is already in the room, just update their info
          rooms[roomId].users[existingUserIndex] = { ...user, id: socket.id, isHost: rooms[roomId].users[existingUserIndex].isHost }
          socket.join(roomId)
          io.to(roomId).emit('room-updated', rooms[roomId])
        } else if (isFirstUser) {
          // First user becomes host automatically
          rooms[roomId].users.push({ ...user, id: socket.id, isHost: true })
          socket.join(roomId)
          io.to(roomId).emit('room-updated', rooms[roomId])
        } else {
          // Add user to pending list for approval
          const pendingUser: PendingUser = {
            id: Math.random().toString(36).substring(2, 9),
            name: user.name,
            role: user.role,
            socketId: socket.id
          }
          
          rooms[roomId].pendingUsers.push(pendingUser)
          
          // Notify host about pending user
          const hostSocket = rooms[roomId].users.find(u => u.isHost)
          if (hostSocket) {
            io.to(roomId).emit('pending-user-request', {
              pendingUser,
              roomData: rooms[roomId]
            })
          }
          
          // Send waiting message to the requesting user
          socket.emit('waiting-for-approval', {
            message: 'Waiting for host approval to join the room...'
          })
        }
      })

      socket.on('approve-user', (data: { roomId: string; pendingUserId: string }) => {
        const { roomId, pendingUserId } = data
        if (rooms[roomId]) {
          const pendingUserIndex = rooms[roomId].pendingUsers.findIndex(u => u.id === pendingUserId)
          if (pendingUserIndex >= 0) {
            const pendingUser = rooms[roomId].pendingUsers[pendingUserIndex]
            
            // Add user to the room
            const newUser: User = {
              id: pendingUser.socketId,
              name: pendingUser.name,
              role: pendingUser.role,
              isHost: false
            }
            
            rooms[roomId].users.push(newUser)
            rooms[roomId].pendingUsers.splice(pendingUserIndex, 1)
            
            // Let the user join the room
            const userSocket = io.sockets.sockets.get(pendingUser.socketId)
            if (userSocket) {
              userSocket.join(roomId)
              userSocket.emit('approval-granted')
            }
            
            io.to(roomId).emit('room-updated', rooms[roomId])
          }
        }
      })

      socket.on('reject-user', (data: { roomId: string; pendingUserId: string }) => {
        const { roomId, pendingUserId } = data
        if (rooms[roomId]) {
          const pendingUserIndex = rooms[roomId].pendingUsers.findIndex(u => u.id === pendingUserId)
          if (pendingUserIndex >= 0) {
            const pendingUser = rooms[roomId].pendingUsers[pendingUserIndex]
            
            // Remove from pending list
            rooms[roomId].pendingUsers.splice(pendingUserIndex, 1)
            
            // Notify the rejected user
            const userSocket = io.sockets.sockets.get(pendingUser.socketId)
            if (userSocket) {
              userSocket.emit('approval-rejected', {
                message: 'Your request to join the room was rejected by the host.'
              })
            }
            
            io.to(roomId).emit('room-updated', rooms[roomId])
          }
        }
      })

      socket.on('create-issue', (data: { roomId: string; issue: Omit<Issue, 'id' | 'votes' | 'isCompleted'> }) => {
        const { roomId, issue } = data
        if (rooms[roomId]) {
          const newIssue: Issue = {
            ...issue,
            id: Math.random().toString(36).substring(2, 9),
            votes: {},
            isCompleted: false
          }
          rooms[roomId].issues.push(newIssue)
          if (!rooms[roomId].currentIssue) {
            rooms[roomId].currentIssue = newIssue
          }
          io.to(roomId).emit('room-updated', rooms[roomId])
        }
      })

      socket.on('edit-issue', (data: { roomId: string; issueId: string; updates: Partial<Issue> }) => {
        const { roomId, issueId, updates } = data
        if (rooms[roomId]) {
          const issueIndex = rooms[roomId].issues.findIndex(i => i.id === issueId)
          if (issueIndex >= 0) {
            rooms[roomId].issues[issueIndex] = { ...rooms[roomId].issues[issueIndex], ...updates }
            if (rooms[roomId].currentIssue?.id === issueId) {
              rooms[roomId].currentIssue = rooms[roomId].issues[issueIndex]
            }
            io.to(roomId).emit('room-updated', rooms[roomId])
          }
        }
      })

      socket.on('delete-issue', (data: { roomId: string; issueId: string }) => {
        const { roomId, issueId } = data
        if (rooms[roomId]) {
          rooms[roomId].issues = rooms[roomId].issues.filter(i => i.id !== issueId)
          if (rooms[roomId].currentIssue?.id === issueId) {
            rooms[roomId].currentIssue = rooms[roomId].issues[0] || null
          }
          io.to(roomId).emit('room-updated', rooms[roomId])
        }
      })

      socket.on('select-issue', (data: { roomId: string; issueId: string }) => {
        const { roomId, issueId } = data
        if (rooms[roomId]) {
          // Only host can select issues
          const user = rooms[roomId].users.find(u => u.id === socket.id)
          if (user && user.isHost) {
            const issue = rooms[roomId].issues.find(i => i.id === issueId)
            if (issue) {
              rooms[roomId].currentIssue = issue
              rooms[roomId].votes = {}
              rooms[roomId].votingRevealed = false
              io.to(roomId).emit('room-updated', rooms[roomId])
            }
          }
        }
      })

      socket.on('vote', (data: { roomId: string; vote: number }) => {
        const { roomId, vote } = data
        if (rooms[roomId] && rooms[roomId].currentIssue) {
          rooms[roomId].votes[socket.id] = vote
          
          const participants = rooms[roomId].users.filter(u => u.role === 'participant')
          const votedCount = Object.keys(rooms[roomId].votes).length
          
          if (votedCount === participants.length) {
            rooms[roomId].votingRevealed = true
            
            if (rooms[roomId].currentIssue) {
              const issueIndex = rooms[roomId].issues.findIndex(i => i.id === rooms[roomId].currentIssue!.id)
              if (issueIndex >= 0) {
                rooms[roomId].issues[issueIndex].votes = { ...rooms[roomId].votes }
              }
            }
          }
          
          io.to(roomId).emit('room-updated', rooms[roomId])
        }
      })

      socket.on('next-round', (data: { roomId: string }) => {
        const { roomId } = data
        if (rooms[roomId] && rooms[roomId].currentIssue) {
          const votes = Object.values(rooms[roomId].votes)
          const allSame = votes.length > 0 && votes.every(v => v === votes[0])
          
          if (allSame) {
            const issueIndex = rooms[roomId].issues.findIndex(i => i.id === rooms[roomId].currentIssue!.id)
            if (issueIndex >= 0) {
              rooms[roomId].issues[issueIndex].isCompleted = true
              rooms[roomId].issues[issueIndex].finalEstimate = votes[0]
            }
            
            const nextIssue = rooms[roomId].issues.find(i => !i.isCompleted)
            rooms[roomId].currentIssue = nextIssue || null
            rooms[roomId].votes = {}
            rooms[roomId].votingRevealed = false
            
            io.to(roomId).emit('room-updated', rooms[roomId])
          }
        }
      })

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
        
        Object.keys(rooms).forEach(roomId => {
          rooms[roomId].users = rooms[roomId].users.filter(u => u.id !== socket.id)
          delete rooms[roomId].votes[socket.id]
          
          if (rooms[roomId].users.length === 0) {
            delete rooms[roomId]
          } else {
            io.to(roomId).emit('room-updated', rooms[roomId])
          }
        })
      })
    })
  }
  res.end()
}