'use client'

interface User {
  id: string
  name: string
  role: 'participant' | 'spectator'
  isHost: boolean
}

interface UserListProps {
  users: User[]
  currentUserId: string
}

export default function UserList({ users, currentUserId }: UserListProps) {
  const participants = users.filter(u => u.role === 'participant')
  const spectators = users.filter(u => u.role === 'spectator')

  return (
    <div className="card-modern p-6 animate-fade-in">
      <h3 className="text-xl font-bold gradient-text mb-6 flex items-center">
        👥 Users in Room
      </h3>
      
      {participants.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            🎯 Participants ({participants.length})
          </h4>
          <div className="space-y-3">
            {participants.map((user) => (
              <div
                key={user.id}
                className={`
                  flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-105
                  ${user.id === currentUserId 
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/50 shadow-lg' 
                    : 'glass-effect border border-slate-600/30 hover:border-primary/30'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse shadow-lg shadow-success/50"></div>
                  <span className="font-semibold text-white">
                    {user.name}
                    {user.id === currentUserId && ' (You)'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {user.isHost && (
                    <span className="text-xs bg-gradient-to-r from-warning to-warning-light text-slate-900 px-3 py-1 rounded-full font-bold">
                      👑 Host
                    </span>
                  )}
                  <span className="text-xs bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full font-bold">
                    🎯 Participant
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {spectators.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            👁️ Spectators ({spectators.length})
          </h4>
          <div className="space-y-3">
            {spectators.map((user) => (
              <div
                key={user.id}
                className={`
                  flex items-center justify-between p-4 rounded-xl transition-all duration-300 hover:scale-105
                  ${user.id === currentUserId 
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/50 shadow-lg' 
                    : 'glass-effect border border-slate-600/30 hover:border-primary/30'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-white">
                    {user.name}
                    {user.id === currentUserId && ' (You)'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {user.isHost && (
                    <span className="text-xs bg-gradient-to-r from-warning to-warning-light text-slate-900 px-3 py-1 rounded-full font-bold">
                      👑 Host
                    </span>
                  )}
                  <span className="text-xs bg-gradient-to-r from-slate-600 to-slate-700 text-white px-3 py-1 rounded-full font-bold">
                    👁️ Spectator
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {users.length === 0 && (
        <p className="text-slate-400 text-center py-8 text-lg">🚫 No users in room</p>
      )}
    </div>
  )
}