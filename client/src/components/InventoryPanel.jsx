import { useState, useEffect } from 'react'
import api from '../api/axios'
import { Layers, AlertTriangle, CheckCircle, RotateCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function InventoryPanel() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials')
      setMaterials(response.data)
    } catch (err) {
      console.error('Failed to fetch materials:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()

    const handleMaterialRefresh = (e) => {
      const updatedMaterial = e.detail
      if (!updatedMaterial) return
      setMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m))
    }

    window.addEventListener('material-refresh', handleMaterialRefresh)

    // Poll inventory every 3s to reflect consumption in real-time
    const interval = setInterval(fetchMaterials, 3000)
    return () => {
      window.removeEventListener('material-refresh', handleMaterialRefresh)
      clearInterval(interval)
    }
  }, [])

  const handleRestock = async (id, name) => {
    try {
      await api.put(`/materials/${id}/restock?quantity=100`)
      toast.success(`Successfully replenished ${name} to 100 units!`)
      fetchMaterials()
    } catch (err) {
      toast.error(`Restock failed: ${err.response?.data?.message || err.message}`)
    }
  }

  const getStatusBadge = (stock, threshold) => {
    if (stock === 0) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-500/10 border border-red-500/30 text-red-500 flex items-center gap-1.5 w-fit">
          ● OUT OF STOCK
        </span>
      )
    }
    if (stock <= threshold) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center gap-1.5 w-fit">
          ● LOW STOCK
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 w-fit">
        ● OK
      </span>
    )
  }

  const canRestock = user && (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_TEAM_LEADER')

  return (
    <div className="bg-slate-900 p-6 rounded border border-slate-800 shadow-md w-full animate-fade-in flex flex-col gap-6">
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-cyan-400" />
            JIT Inventory & Kanban Material Control
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time material consumption levels, reorder alerts, and JIT line-stop monitoring.
          </p>
        </div>
        <button 
          onClick={fetchMaterials}
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition"
          title="Refresh stock levels"
        >
          <RotateCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="text-center text-xs text-slate-500 py-8">Loading inventory stock levels...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-mono">
                <th className="pb-3 pl-2">ID</th>
                <th className="pb-3">Material Name</th>
                <th className="pb-3">Current Stock</th>
                <th className="pb-3">Min Threshold</th>
                <th className="pb-3">Status</th>
                {canRestock && <th className="pb-3 text-right pr-2">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 pl-2 font-mono text-slate-500">{m.id}</td>
                  <td className="py-3.5 font-bold text-white">{m.name}</td>
                  <td className="py-3.5 font-mono text-slate-200">
                    <span className={m.stockQuantity <= m.minThreshold ? 'text-amber-400 font-black' : ''}>
                      {m.stockQuantity}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-slate-400">{m.minThreshold}</td>
                  <td className="py-3.5">{getStatusBadge(m.stockQuantity, m.minThreshold)}</td>
                  {canRestock && (
                    <td className="py-3.5 text-right pr-2">
                      <button
                        onClick={() => handleRestock(m.id, m.name)}
                        className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 font-bold transition text-[10px]"
                      >
                        Replenish
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
