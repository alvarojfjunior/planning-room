'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CreateRoomModal from '@/components/CreateRoomModal'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const handleCreateRoom = (roomData: { roomName: string; userName: string; role: 'participant' | 'spectator' }) => {
    // Generate simple room ID
    const roomId = Math.random().toString(36).substring(2, 8)
    
    // Store user data in localStorage
    localStorage.setItem('userData', JSON.stringify({
      name: roomData.userName,
      role: roomData.role,
      isHost: true
    }))
    
    // Redirect to room with user data in URL params
    const params = new URLSearchParams({
      roomName: roomData.roomName,
      userName: roomData.userName,
      userRole: roomData.role,
      isHost: 'true'
    })
    
    router.push(`/room/${roomId}?${params.toString()}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-modern p-8 max-w-md w-full text-center animate-scale-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-3">Planning Room</h1>
          <p className="text-slate-300 text-lg">Collaborative estimation made simple</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary py-4 px-8 rounded-xl text-lg font-semibold w-full mb-6"
        >
          🚀 Create Room
        </button>
        
        <div className="text-sm text-slate-400">
          <p>Start your planning session with your team</p>
        </div>
      </div>
      
      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />
    </div>
  )
}