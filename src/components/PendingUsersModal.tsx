'use client'

import { useState } from 'react'

interface PendingUser {
  id: string
  name: string
  role: 'participant' | 'spectator'
  socketId: string
}

interface PendingUsersModalProps {
  isOpen: boolean
  pendingUsers: PendingUser[]
  onApprove: (userId: string) => void
  onReject: (userId: string) => void
  onClose: () => void
}

export default function PendingUsersModal({
  isOpen,
  pendingUsers,
  onApprove,
  onReject,
  onClose
}: PendingUsersModalProps) {
  if (!isOpen || pendingUsers.length === 0) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="glass-effect max-w-md w-full p-6 rounded-2xl animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center">
            🚪 Pending Requests
            <span className="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
              {pendingUsers.length}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl transition-colors duration-200 hover:rotate-90 transform transition-transform"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pendingUsers.map((user) => (
            <div
              key={user.id}
              className="bg-slate-800/30 border border-slate-600/30 rounded-xl p-4 animate-fade-in"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{user.name}</h3>
                  <p className="text-sm text-slate-400 flex items-center">
                    {user.role === 'participant' ? '🗳️ Participant' : '👁️ Spectator'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onApprove(user.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => onReject(user.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-600/30">
          <p className="text-xs text-slate-400 text-center">
            As the host, you can approve or reject users who want to join your room.
          </p>
        </div>
      </div>
    </div>
  )
}