'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

type CreateRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    roomName: '',
    userName: '',
    role: 'participant' as 'participant' | 'spectator',
    seed: Math.random().toString(36).substring(2, 8)
  });
  const [avatarSvg, setAvatarSvg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const avatar = createAvatar(lorelei, {
      seed: formData.seed,
      size: 128,
    });
    setAvatarSvg(avatar.toDataUriSync());
  }, [formData.seed]);

  if (!isOpen && !isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = Math.random().toString(36).substring(2, 8);
    localStorage.setItem('userName', formData.userName);
    localStorage.setItem('userRole', formData.role);
    localStorage.setItem('userAvatar', formData.seed);
    router.push(`/room/${roomId}`);
  };

  const generateNewAvatar = () => {
    setFormData(prev => ({
      ...prev,
      seed: Math.random().toString(36).substring(2, 8)
    }));
  };

  return (
    <div 
      className={`
        fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50
        transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onClose}
    >
      <div 
        className={`
          bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl w-full max-w-md
          relative transform transition-all duration-300 shadow-2xl
          border border-gray-700/50
          ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors hover:rotate-90 transform duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative">
          <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
            Create New Room
          </h2>
          <p className="text-gray-400 mb-6">Set up your poker planning session</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Selection */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group cursor-pointer" onClick={generateNewAvatar}>
                <img
                  src={avatarSvg}
                  alt="User Avatar"
                  className="w-24 h-24 rounded-full border-4 border-purple-500/30 transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">Click to generate new avatar</p>
            </div>

            <div className="group">
              <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-purple-400 transition-colors">
                Room Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="roomName"
                  required
                  value={formData.roomName}
                  onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                  className="
                    w-full px-4 py-3 rounded-lg
                    bg-gray-800/50 border border-gray-700
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500
                    transition-all duration-200
                  "
                  placeholder="e.g., Sprint 23 Planning"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div className="group">
              <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2 group-focus-within:text-purple-400 transition-colors">
                Your Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="userName"
                  required
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="
                    w-full px-4 py-3 rounded-lg
                    bg-gray-800/50 border border-gray-700
                    text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500
                    transition-all duration-200
                  "
                  placeholder="e.g., John Doe"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Role
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'participant' })}
                  className={`
                    relative overflow-hidden px-4 py-3 rounded-lg text-sm font-medium
                    transition-all duration-200 transform hover:scale-105
                    ${formData.role === 'participant'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'}
                  `}
                >
                  <span className="relative z-10">Participant</span>
                  {formData.role === 'participant' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 animate-gradient-xy"></div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'spectator' })}
                  className={`
                    relative overflow-hidden px-4 py-3 rounded-lg text-sm font-medium
                    transition-all duration-200 transform hover:scale-105
                    ${formData.role === 'spectator'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'}
                  `}
                >
                  <span className="relative z-10">Spectator</span>
                  {formData.role === 'spectator' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 animate-gradient-xy"></div>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="
                relative w-full px-6 py-3 rounded-lg overflow-hidden group
                bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600
                text-white font-medium text-lg
                transform transition-all duration-200
                hover:scale-[1.02] focus:scale-[1.02]
                focus:outline-none focus:ring-2 focus:ring-purple-500/50
                shadow-lg shadow-purple-500/25
              "
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-xy opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative flex items-center justify-center gap-2">
                Create Room
                <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}