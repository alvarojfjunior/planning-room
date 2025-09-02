'use client'

interface VotingCardProps {
  value: number
  isSelected: boolean
  isRevealed: boolean
  onClick: () => void
  disabled: boolean
}

export default function VotingCard({ value, isSelected, isRevealed, onClick, disabled }: VotingCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-20 h-28 rounded-xl border-2 font-bold text-2xl transition-all duration-300 shadow-lg
        ${isSelected
          ? 'border-primary bg-gradient-to-br from-primary to-secondary text-white scale-110 shadow-primary/50'
          : 'border-slate-600/50 glass-effect text-white hover:border-primary/50 hover:shadow-primary/30'
        }
        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105 hover:-translate-y-1'}
        backdrop-blur-sm
      `}
    >
      {value}
    </button>
  )
}