'use client'

import { useState } from 'react'

interface Issue {
  id: string
  title: string
  description: string
  votes: Record<string, number>
  isCompleted: boolean
  finalEstimate?: number
}

interface IssueManagerProps {
  issues: Issue[]
  currentIssue: Issue | null
  onCreateIssue: (issue: { title: string; description: string }) => void
  onEditIssue: (issueId: string, updates: Partial<Issue>) => void
  onDeleteIssue: (issueId: string) => void
  onSelectIssue: (issueId: string) => void
  canManage: boolean
}

export default function IssueManager({
  issues,
  currentIssue,
  onCreateIssue,
  onEditIssue,
  onDeleteIssue,
  onSelectIssue,
  canManage
}: IssueManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newIssue, setNewIssue] = useState({ title: '', description: '' })
  const [editIssue, setEditIssue] = useState({ title: '', description: '' })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newIssue.title.trim()) {
      onCreateIssue({
        title: newIssue.title.trim(),
        description: newIssue.description.trim()
      })
      setNewIssue({ title: '', description: '' })
      setIsCreating(false)
    }
  }

  const handleEditSubmit = (e: React.FormEvent, issueId: string) => {
    e.preventDefault()
    if (editIssue.title.trim()) {
      onEditIssue(issueId, {
        title: editIssue.title.trim(),
        description: editIssue.description.trim()
      })
      setEditingId(null)
      setEditIssue({ title: '', description: '' })
    }
  }

  const startEditing = (issue: Issue) => {
    setEditingId(issue.id)
    setEditIssue({ title: issue.title, description: issue.description })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditIssue({ title: '', description: '' })
  }

  return (
    <div className="card-modern p-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold gradient-text flex items-center">
          📋 Issues
        </h2>
        {canManage && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary px-6 py-3 rounded-xl font-semibold"
          >
            ➕ Add Issue
          </button>
        )}
      </div>

      {/* Create Issue Form */}
      {isCreating && (
        <div className="mb-6 p-6 glass-effect border border-slate-600/30 rounded-xl animate-scale-in">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            ✨ Create New Issue
          </h3>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Issue title"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                className="input-modern w-full"
                required
              />
            </div>
            <div>
              <textarea
                placeholder="Issue description (optional)"
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                className="input-modern w-full h-24 resize-none"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="btn-success px-6 py-3 rounded-xl font-semibold"
              >
                ✅ Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false)
                  setNewIssue({ title: '', description: '' })
                }}
                className="btn-secondary px-6 py-3 rounded-xl font-semibold"
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Issues List */}
      <div className="space-y-4">
        {issues.length === 0 ? (
          <p className="text-slate-400 text-center py-12 text-lg">📝 No issues created yet</p>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className={`
                p-6 border rounded-xl transition-all duration-300 hover:scale-105 animate-fade-in
                ${currentIssue?.id === issue.id
                  ? 'border-primary bg-gradient-to-r from-primary/20 to-secondary/20 shadow-lg shadow-primary/30'
                  : issue.isCompleted
                  ? 'border-success bg-gradient-to-r from-success/20 to-success/10 shadow-lg shadow-success/30'
                  : 'glass-effect border-slate-600/30 hover:border-primary/50'
                }
              `}
            >
              {editingId === issue.id ? (
                <form onSubmit={(e) => handleEditSubmit(e, issue.id)} className="space-y-4">
                  <input
                    type="text"
                    value={editIssue.title}
                    onChange={(e) => setEditIssue({ ...editIssue, title: e.target.value })}
                    className="input-modern w-full"
                    required
                  />
                  <textarea
                    value={editIssue.description}
                    onChange={(e) => setEditIssue({ ...editIssue, description: e.target.value })}
                    className="input-modern w-full h-24 resize-none"
                  />
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="btn-success px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      💾 Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="btn-secondary px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg flex items-center">
                        {issue.isCompleted ? '✅' : currentIssue?.id === issue.id ? '🎯' : '📝'} {issue.title}
                      </h3>
                      {issue.description && (
                        <p className="text-slate-300 text-sm mt-2 bg-slate-800/30 p-2 rounded-lg">{issue.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {issue.isCompleted && (
                        <span className="text-xs bg-gradient-to-r from-success to-success-light text-white px-3 py-1 rounded-full font-bold">
                          🎯 Estimate: {issue.finalEstimate}
                        </span>
                      )}
                      {currentIssue?.id === issue.id && (
                        <span className="text-xs bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full font-bold animate-pulse">
                          🔥 Current
                        </span>
                      )}
                      {canManage && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onSelectIssue(issue.id)}
                            className="bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full text-xs font-bold hover:scale-105 transition-all duration-200"
                          >
                            🎯 Select
                          </button>
                          {!issue.isCompleted && (
                            <>
                              <button
                                onClick={() => startEditing(issue)}
                                className="bg-gradient-to-r from-warning to-warning-light text-slate-900 px-3 py-1 rounded-full text-xs font-bold hover:scale-105 transition-all duration-200"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => onDeleteIssue(issue.id)}
                                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold hover:scale-105 transition-all duration-200"
                              >
                                🗑️ Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}