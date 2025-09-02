'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import VotingCard from '@/components/VotingCard'
import UserList from '@/components/UserList'
import IssueManager from '@/components/IssueManager'
import JoinRoomModal from '@/components/JoinRoomModal'
import PendingUsersModal from '@/components/PendingUsersModal'
import { saveAs } from 'file-saver'

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

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = params?.roomId as string
  const roomName = searchParams?.get('roomName')
  
  const [socket, setSocket] = useState<Socket | null>(null)
  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userVote, setUserVote] = useState<number | null>(null)
  const [copySuccess, setCopySuccess] = useState<boolean>(false)
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false)
  const [showPendingModal, setShowPendingModal] = useState<boolean>(false)
  const [waitingForApproval, setWaitingForApproval] = useState<boolean>(false)
  const [approvalMessage, setApprovalMessage] = useState<string>('')

  const initializeSocket = (user: User) => {
    // Initialize socket connection
    const socketInstance = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      path: '/api/socket',
    })

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      socketInstance.emit('join-room', {
        roomId,
        user: {
          ...user,
          id: socketInstance.id
        },
        roomName: roomName || roomData?.name || `Room ${roomId}`
      })
    })

    socketInstance.on('room-updated', (data: RoomData) => {
      setRoomData(data)
      // Reset user vote if voting was reset
      if (!data.votingRevealed && Object.keys(data.votes).length === 0) {
        setUserVote(null)
      }
    })

    socketInstance.on('pending-user-request', (pendingUser: PendingUser) => {
      setShowPendingModal(true)
    })

    socketInstance.on('waiting-for-approval', (message: string) => {
      setWaitingForApproval(true)
      setApprovalMessage(message)
    })

    socketInstance.on('approval-granted', () => {
      setWaitingForApproval(false)
      setApprovalMessage('')
    })

    socketInstance.on('approval-denied', (message: string) => {
      setWaitingForApproval(false)
      setApprovalMessage(message)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }

  const handleJoinRoom = (data: { userName: string; role: 'participant' | 'spectator' }) => {
    const user: User = {
      id: '',
      name: data.userName,
      role: data.role,
      isHost: false
    }
    
    // Save user data to localStorage
    localStorage.setItem('userData', JSON.stringify(user))
    setCurrentUser(user)
    setShowJoinModal(false)
    
    // Initialize socket connection
    const cleanup = initializeSocket(user)
    return cleanup
  }

  useEffect(() => {
    // Check if user data comes from room creation (searchParams)
    const userName = searchParams?.get('userName')
    const userRole = searchParams?.get('userRole') as 'participant' | 'spectator'
    const isHost = searchParams?.get('isHost') === 'true'
    
    if (userName && userRole) {
      // User is coming from room creation, auto-join
      const user: User = {
        id: '',
        name: userName,
        role: userRole,
        isHost: isHost
      }
      
      localStorage.setItem('userData', JSON.stringify(user))
      setCurrentUser(user)
      setShowJoinModal(false)
      
      // Initialize socket connection
      initializeSocket(user)
    } else {
      // User is accessing via direct link, show join modal
      setShowJoinModal(true)
    }
  }, [roomId, roomName, router, searchParams])

  const handleVote = (vote: number) => {
    if (socket && currentUser?.role === 'participant' && !roomData?.votingRevealed) {
      setUserVote(vote)
      socket.emit('vote', { roomId, vote })
    }
  }

  const handleNextRound = () => {
    if (socket) {
      socket.emit('next-round', { roomId })
    }
  }

  const handleCreateIssue = (issue: { title: string; description: string }) => {
    if (socket) {
      socket.emit('create-issue', { roomId, issue })
    }
  }

  const handleEditIssue = (issueId: string, updates: Partial<Issue>) => {
    if (socket) {
      socket.emit('edit-issue', { roomId, issueId, updates })
    }
  }

  const handleDeleteIssue = (issueId: string) => {
    if (socket) {
      socket.emit('delete-issue', { roomId, issueId })
    }
  }

  const handleSelectIssue = (issueId: string) => {
    if (socket) {
      socket.emit('select-issue', { roomId, issueId })
    }
  }

  const handleExportResults = () => {
    if (!roomData) return

    const completedIssues = roomData.issues.filter(issue => issue.isCompleted)
    const exportData = {
      roomName: roomData.name,
      exportDate: new Date().toISOString(),
      issues: completedIssues.map(issue => ({
        title: issue.title,
        description: issue.description,
        finalEstimate: issue.finalEstimate,
        votes: issue.votes
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    saveAs(blob, `planning-poker-${roomData.name}-${new Date().toISOString().split('T')[0]}.json`)
  }

  const handleCopyRoomAddress = async () => {
    if (typeof window === 'undefined') return
    
    const roomAddress = `${window.location.origin}/room/${roomId}${roomName ? `?roomName=${encodeURIComponent(roomName)}` : ''}`
    
    try {
      await navigator.clipboard.writeText(roomAddress)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy room address:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = roomAddress
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleApproveUser = (userId: string) => {
    if (socket) {
      socket.emit('approve-user', { roomId, userId })
    }
  }

  const handleRejectUser = (userId: string) => {
    if (socket) {
      socket.emit('reject-user', { roomId, userId })
    }
  }

  if (showJoinModal) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <JoinRoomModal
          isOpen={showJoinModal}
          roomName={roomData?.name || `Room ${roomId}`}
          onJoinRoom={handleJoinRoom}
        />
      </div>
    )
  }

  if (waitingForApproval) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="glass-effect max-w-md w-full p-8 rounded-2xl text-center animate-scale-in">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-white mb-4">Waiting for Approval</h2>
          <p className="text-slate-300 mb-6">
            {approvalMessage || 'The room host needs to approve your request to join this room. Please wait...'}
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!roomData || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-300">Loading room...</p>
        </div>
      </div>
    )
  }

  const participants = roomData.users.filter(u => u.role === 'participant')
  const votedCount = Object.keys(roomData.votes).length
  const allVoted = votedCount === participants.length && participants.length > 0
  const votes = Object.values(roomData.votes)
  const allSameVote = votes.length > 0 && votes.every(v => v === votes[0])
  const canProceed = allVoted && allSameVote && roomData.votingRevealed

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="card-modern p-6 mb-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">{roomData.name}</h1>
              {currentUser.isHost && (
                <div className="flex items-center space-x-2">
                  <span className="text-slate-300">🔗 Room Address:</span>
                  <button
                    onClick={handleCopyRoomAddress}
                    className="text-primary hover:text-primary-light underline font-medium transition-all duration-300 flex items-center space-x-1 hover:scale-105"
                    title="Click to copy room address"
                  >
                    <span className="text-sm">{typeof window !== 'undefined' ? `${window.location.origin}/room/${roomId}${roomName ? `?roomName=${encodeURIComponent(roomName)}` : ''}` : `room/${roomId}`}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  {copySuccess && (
                    <span className="text-success text-sm font-medium animate-scale-in">
                      ✅ Copied!
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              {currentUser.isHost && roomData.pendingUsers && roomData.pendingUsers.length > 0 && (
                <button
                  onClick={() => setShowPendingModal(true)}
                  className="btn-primary px-6 py-3 rounded-xl font-semibold relative animate-pulse"
                >
                  🚪 Pending Requests
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {roomData.pendingUsers.length}
                  </span>
                </button>
              )}
              {currentUser.isHost && (
                <button
                  onClick={handleExportResults}
                  className="btn-success px-6 py-3 rounded-xl font-semibold"
                  disabled={roomData.issues.filter(i => i.isCompleted).length === 0}
                >
                  📊 Export Results
                </button>
              )}
              <button
                onClick={() => router.push('/')}
                className="btn-secondary px-6 py-3 rounded-xl font-semibold"
              >
                🚪 Leave Room
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Issues */}
          <div className="lg:col-span-2">
            <IssueManager
              issues={roomData.issues}
              currentIssue={roomData.currentIssue}
              onCreateIssue={handleCreateIssue}
              onEditIssue={handleEditIssue}
              onDeleteIssue={handleDeleteIssue}
              onSelectIssue={handleSelectIssue}
              canManage={currentUser.isHost}
            />

            {/* Voting Section */}
            {roomData.currentIssue && (
              <div className="card-modern p-6 mt-6 animate-fade-in">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center">
                    🎯 Current Issue: <span className="gradient-text ml-2">{roomData.currentIssue.title}</span>
                  </h3>
                  <p className="text-slate-300 bg-slate-800/30 p-3 rounded-lg border border-slate-600/30">{roomData.currentIssue.description}</p>
                </div>

                {currentUser.role === 'participant' && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      🗳️ Your Vote:
                    </h4>
                    <div className="flex space-x-3 justify-center">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <VotingCard
                          key={value}
                          value={value}
                          isSelected={userVote === value}
                          isRevealed={roomData.votingRevealed}
                          onClick={() => handleVote(value)}
                          disabled={roomData.votingRevealed}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Voting Status */}
                <div className="mb-4">
                  <p className="text-slate-300 text-sm flex items-center">
                    📊 Votes: <span className="text-primary font-semibold ml-1">{votedCount} / {participants.length}</span> participants
                  </p>
                  {roomData.votingRevealed && (
                    <div className="mt-4">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        📈 Results:
                      </h4>
                      <div className="flex space-x-3 justify-center flex-wrap gap-2">
                        {Object.entries(roomData.votes).map(([userId, vote]) => {
                          const user = roomData.users.find(u => u.id === userId)
                          return (
                            <div key={userId} className="text-center animate-scale-in">
                              <div className="bg-gradient-to-br from-primary to-secondary text-white px-4 py-3 rounded-xl font-bold text-lg shadow-lg">
                                {vote}
                              </div>
                              <p className="text-xs text-slate-300 mt-2 font-medium">{user?.name}</p>
                            </div>
                          )
                        })}
                      </div>
                      {allSameVote ? (
                        <p className="text-success font-bold mt-4 text-center text-lg animate-pulse">🎉 Consensus reached!</p>
                      ) : (
                        <p className="text-warning font-bold mt-4 text-center text-lg">⚠️ No consensus - discuss and vote again</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Next Round Button */}
                {canProceed && (
                  <button
                    onClick={handleNextRound}
                    className="btn-primary w-full py-4 px-6 rounded-xl font-bold text-lg mt-6 animate-pulse"
                  >
                    🚀 Next Round
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Users */}
          <div>
            <UserList users={roomData.users} currentUserId={currentUser.id} />
          </div>
        </div>
      </div>
      
      {/* Join Room Modal */}
      <JoinRoomModal
        isOpen={showJoinModal}
        roomName={roomData?.name || `Room ${roomId}`}
        onJoinRoom={handleJoinRoom}
      />
      
      {/* Pending Users Modal */}
      <PendingUsersModal
        isOpen={showPendingModal}
        pendingUsers={roomData?.pendingUsers || []}
        onApprove={handleApproveUser}
        onReject={handleRejectUser}
        onClose={() => setShowPendingModal(false)}
      />
    </div>
  )
}