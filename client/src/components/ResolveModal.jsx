import { useState, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { X, CheckCircle, MessageSquare } from 'lucide-react'

export default function ResolveModal({ alert, onClose, onResolved }) {
  const { user } = useAuth()
  const [comment, setComment]   = useState('')
  const [loading, setLoading]   = useState(false)

  const handleResolve = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return toast.error('Please enter a resolution comment')
    setLoading(true)
    try {
      await api.put(`/andon/${alert.id}/resolve`, { comment })
      toast.success('✅ Alert resolved successfully!', { duration: 4000 })
      onResolved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve alert')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="glass-card p-6 w-full max-w-md mx-4 animate-fade-in"
        style={{ border: '1px solid #ef444466' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#ef444422', border: '1px solid #ef444466' }}
            >
              <CheckCircle size={20} color="#ef4444" />
            </div>
            <div>
              <h3 className="text-white font-bold">Resolve Alert</h3>
              <p className="text-xs text-gray-500">Alert #{alert.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Alert details */}
        <div
          className="rounded-lg p-3 mb-4 text-sm"
          style={{ background: '#1a08081a', border: '1px solid #ef444433' }}
        >
          <p className="text-gray-400 mb-1 text-xs">ALERT MESSAGE</p>
          <p className="text-red-300 font-medium">{alert.message}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>Station #{alert.stationId}</span>
            <span>Cycle #{alert.cycleNumber}</span>
            <span>
              Δ {alert.taktTime
                ? `${(alert.totalCycleTime - alert.taktTime).toFixed(1)}s over takt`
                : `${alert.totalCycleTime?.toFixed(1)}s`
              }
            </span>
          </div>
        </div>

        {/* Resolver info */}
        <div
          className="rounded-lg p-3 mb-4 text-xs"
          style={{ background: '#00120822', border: '1px solid #10b98133' }}
        >
          <span className="text-gray-500">Resolving as: </span>
          <span className="text-green-400 font-semibold">{user?.email}</span>
          <span className="text-gray-600"> ({user?.role?.replace('ROLE_', '')})</span>
        </div>

        <form onSubmit={handleResolve} className="flex flex-col gap-4">
          <div>
            <label className="section-label flex items-center gap-1.5 mb-2">
              <MessageSquare size={10} />
              Resolution Comment
            </label>
            <textarea
              className="tt-input resize-none"
              style={{ minHeight: '100px' }}
              placeholder="e.g. Operator training completed, standard work revised. Root cause identified as tooling wear..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={500}
            />
            <p className="text-right text-xs text-gray-600 mt-1">{comment.length}/500</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="tt-btn tt-btn-ghost flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tt-btn tt-btn-primary flex-1"
              disabled={loading || !comment.trim()}
            >
              {loading
                ? <span className="animate-spin-slow inline-block">⚙</span>
                : <><CheckCircle size={15}/> Resolve</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
