'use client'

import { useState } from 'react'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateRoom: (data: { roomName: string; userName: string; role: 'participant' | 'spectator' }) => void
}

export default function CreateRoomModal({ isOpen, onClose, onCreateRoom }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('')
  const [userName, setUserName] = useState('')
  const [role, setRole] = useState<'participant' | 'spectator'>('participant')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomName.trim() && userName.trim()) {
      onCreateRoom({ roomName: roomName.trim(), userName: userName.trim(), role })
      setRoomName('')
      setUserName('')
      setRole('participant')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-effect max-w-md w-full p-8 rounded-2xl animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">✨ Create New Room</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl transition-colors duration-200 hover:rotate-90 transform transition-transform"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="roomName" className="block text-sm font-semibold text-slate-200 mb-2">
              🏠 Room Name
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="input-modern w-full"
              placeholder="Enter room name"
              required
            />
          </div>
          
          <div>
            <label htmlFor="userName" className="block text-sm font-semibold text-slate-200 mb-2">
              👤 Your Name
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="input-modern w-full"
              placeholder="Enter your name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-3">
              🎭 Role
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 rounded-xl bg-slate-800/30 border border-slate-600/30 cursor-pointer hover:bg-slate-700/40 transition-all duration-200">
                <input
                  type="radio"
                  name="role"
                  value="participant"
                  checked={role === 'participant'}
                  onChange={(e) => setRole(e.target.value as 'participant' | 'spectator')}
                  className="mr-3 w-4 h-4 text-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-200">🗳️ Participant</span>
                  <p className="text-xs text-slate-400">Can vote and participate in discussions</p>
                </div>
              </label>
              <label className="flex items-center p-3 rounded-xl bg-slate-800/30 border border-slate-600/30 cursor-pointer hover:bg-slate-700/40 transition-all duration-200">
                <input
                  type="radio"
                  name="role"
                  value="spectator"
                  checked={role === 'spectator'}
                  onChange={(e) => setRole(e.target.value as 'participant' | 'spectator')}
                  className="mr-3 w-4 h-4 text-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-200">👁️ Spectator</span>
                  <p className="text-xs text-slate-400">Can observe but cannot vote</p>
                </div>
              </label>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-3 px-6 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 py-3 px-6 rounded-xl font-semibold"
            >
              🚀 Create Room
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}