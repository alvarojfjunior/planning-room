'use client';

import { useState } from 'react';
import { CreateRoomModal } from '@/components/CreateRoomModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 px-4">
      {/* Decorative elements */}
      <div className="absolute top-20 -left-32 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute top-40 -right-32 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-pink-500/30 rounded-full blur-3xl animate-blob animation-delay-4000"></div>

      {/* Playing card decorative elements */}
      <div className="absolute top-10 right-10 w-16 h-20 bg-white/5 rounded-lg transform rotate-12 border border-white/10"></div>
      <div className="absolute bottom-10 left-10 w-16 h-20 bg-white/5 rounded-lg transform -rotate-6 border border-white/10"></div>

      <div className="max-w-5xl mx-auto py-20 relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 animate-expand">
            Planning Poker
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12">
            Collaborate with your team in real-time to estimate tasks efficiently and make better decisions together.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="
              relative px-8 py-4 text-lg font-medium rounded-xl overflow-hidden group
              bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600
              hover-glow transform transition-all duration-300
              hover:scale-105 focus:scale-105
              focus:outline-none focus:ring-2 focus:ring-purple-500/50
            "
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-xy opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative flex items-center gap-2">
              Create New Room
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature cards with poker theme */}
          <div className="
            relative p-6 rounded-2xl
            bg-gradient-to-br from-gray-800/50 to-gray-900/50
            border border-gray-700/50 backdrop-blur-sm
            card-transition group
          ">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="w-12 h-12 mb-4 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-purple-400 transition-colors">
                Anonymous Voting
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                Keep estimations unbiased with secret voting until everyone has made their choice.
              </p>
            </div>
          </div>

          <div className="
            relative p-6 rounded-2xl
            bg-gradient-to-br from-gray-800/50 to-gray-900/50
            border border-gray-700/50 backdrop-blur-sm
            card-transition group
          ">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="w-12 h-12 mb-4 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-pink-400 transition-colors">
                Real-time
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                Experience seamless collaboration with instant updates and live participant tracking.
              </p>
            </div>
          </div>

          <div className="
            relative p-6 rounded-2xl
            bg-gradient-to-br from-gray-800/50 to-gray-900/50
            border border-gray-700/50 backdrop-blur-sm
            card-transition group
          ">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <div className="relative">
              <div className="w-12 h-12 mb-4 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">
                Instant Results
              </h3>
              <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                Watch as votes are revealed with engaging animations and clear visualizations.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CreateRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
