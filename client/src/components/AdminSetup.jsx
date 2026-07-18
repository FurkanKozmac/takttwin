import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Settings, Plus, Layers, ChevronDown, ChevronRight } from 'lucide-react'

const WORK_TYPES = ['MANUAL', 'WALKING', 'MACHINE', 'WAITING']

export default function AdminSetup({ showConfigOnly = false, showOrdersOnly = false }) {
  const { user, hasRole } = useAuth()
  const [stations, setStations]     = useState([])
  const [expanded, setExpanded]     = useState({})
  const [loading, setLoading]       = useState(false)

  // Create station form
  const [stName, setStName]         = useState('Trim-1')
  const [stTakt, setStTakt]         = useState('60')

  // Create element form
  const [elStation, setElStation]   = useState('')
  const [elName, setElName]         = useState('')
  const [elDuration, setElDuration] = useState('')
  const [elType, setElType]         = useState('MANUAL')
  const [elVA, setElVA]             = useState(true)

  // Production Orders state
  const [orders, setOrders]         = useState([])
  const [orderNumber, setOrderNumber] = useState('')
  const [productModel, setProductModel] = useState('')
  const [targetQuantity, setTargetQuantity] = useState('30')
  const [orderLoading, setOrderLoading] = useState(false)

  const isAdmin = hasRole('ROLE_ADMIN')
  const canManageOrders = hasRole('ROLE_ADMIN') || hasRole('ROLE_TEAM_LEADER')

  const fetchStations = async () => {
    try {
      const { data } = await api.get('/stations')
      setStations(Array.isArray(data) ? data : [])
    } catch {}
  }

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch {}
  }

  useEffect(() => {
    fetchStations()
    if (canManageOrders) {
      fetchOrders()
    }
  }, [user])

  const createStation = async (e) => {
    e.preventDefault()
    if (!stName || !stTakt) return
    setLoading(true)
    try {
      await api.post('/stations', { name: stName, taktTime: parseFloat(stTakt) })
      toast.success(`Station "${stName}" created!`)
      setStName('Trim-1'); setStTakt('60')
      fetchStations()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create station')
    } finally {
      setLoading(false)
    }
  }

  const createElement = async (e) => {
    e.preventDefault()
    if (!elStation || !elName || !elDuration) return
    setLoading(true)

    let apiWorkType = elType.toUpperCase()
    if (apiWorkType === 'WALKING') {
      apiWorkType = 'WORKING'
    }

    try {
      await api.post(`/stations/${elStation}/elements`, {
        name: elName,
        standardDuration: parseFloat(elDuration),
        workType: apiWorkType,
        isValueAdded: elVA,
        valueAdded: elVA,
      })
      toast.success(`Element "${elName}" added!`)
      setElName(''); setElDuration('')
      fetchStations()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add element')
    } finally {
      setLoading(false)
    }
  }

  const createOrder = async (e) => {
    e.preventDefault()
    if (!orderNumber || !productModel || !targetQuantity) return
    setOrderLoading(true)
    try {
      await api.post('/orders', {
        orderNumber,
        productModel,
        targetQuantity: parseInt(targetQuantity)
      })
      toast.success(`Order "${orderNumber}" created!`)
      setOrderNumber('')
      setProductModel('')
      setTargetQuantity('30')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order')
    } finally {
      setOrderLoading(false)
    }
  }

  const activateOrder = async (id) => {
    try {
      await api.put(`/orders/${id}/activate`)
      toast.success('Production Order activated!')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate order')
    }
  }

  const fetchStationElements = async (id) => {
    try {
      const { data } = await api.get(`/stations/${id}`)
      setStations(prev => prev.map(s => s.id === id ? { ...s, workElements: data.workElements } : s))
    } catch {}
  }

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = { ...prev, [id]: !prev[id] }
      if (next[id]) fetchStationElements(id)
      return next
    })
  }

  if (!user) return null

  if (showConfigOnly && !isAdmin) {
    return (
      <div className="glass-card p-6 flex flex-col gap-4 animate-fade-in border border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2 text-rose-500">
          <Settings size={18} />
          <h2 className="text-md font-bold">Access Denied</h2>
        </div>
        <p className="text-xs text-slate-400">
          Only Administrators (ROLE_ADMIN) can configure stations and elements.
        </p>
      </div>
    )
  }

  if (showOrdersOnly && !canManageOrders) {
    return (
      <div className="glass-card p-6 flex flex-col gap-4 animate-fade-in border border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2 text-rose-500">
          <Settings size={18} />
          <h2 className="text-md font-bold">Access Denied</h2>
        </div>
        <p className="text-xs text-slate-400">
          Only Administrators or Team Leaders can manage production orders.
        </p>
      </div>
    )
  }

  if (!showConfigOnly && !showOrdersOnly && !isAdmin && !canManageOrders) {
    return null
  }

  const renderConfig = !showOrdersOnly && isAdmin
  const renderOrders = !showConfigOnly && canManageOrders
  const renderStationList = !showOrdersOnly && isAdmin

  const title = showConfigOnly 
    ? "Station Configuration" 
    : showOrdersOnly 
      ? "Production Orders" 
      : "Operations & Setup"

  const subtitle = showConfigOnly 
    ? "Create and manage assembly line stations and work elements" 
    : showOrdersOnly 
      ? "Create and dispatch factory production orders" 
      : "MES Console"

  return (
    <div className="glass-card p-6 flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Settings size={18} color="#475569" />
        <div>
          <p className="section-label">{subtitle}</p>
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
      </div>

      {/* Create Station & Element Section (Admin Only) */}
      {renderConfig && (
        <>
          {/* Create station */}
          <div>
            <p className="section-label mb-3 flex items-center gap-1.5">
              <Plus size={10} /> Create Station
            </p>
            <form onSubmit={createStation} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  className="tt-input flex-1"
                  placeholder="Station name (e.g. Trim-1)"
                  value={stName}
                  onChange={e => setStName(e.target.value)}
                />
                <input
                  className="tt-input"
                  style={{ width: 90 }}
                  type="number"
                  placeholder="Takt (s)"
                  value={stTakt}
                  onChange={e => setStTakt(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="tt-btn tt-btn-primary text-sm font-bold"
              >
                <Plus size={14} /> Create Station
              </button>
            </form>
          </div>

          {/* Add work element */}
          <div className="border-t border-gray-800 pt-4">
            <p className="section-label mb-3 flex items-center gap-1.5">
              <Layers size={10} /> Add Work Element
            </p>
            <form onSubmit={createElement} className="flex flex-col gap-2">
              <select
                className="tt-input"
                value={elStation}
                onChange={e => setElStation(e.target.value)}
              >
                <option value="">Select station...</option>
                {stations.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>
                ))}
              </select>
              <input
                className="tt-input"
                placeholder="Element name (e.g. Bolt torque check)"
                value={elName}
                onChange={e => setElName(e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="tt-input"
                  type="number"
                  step="0.1"
                  placeholder="Duration (s)"
                  value={elDuration}
                  onChange={e => setElDuration(e.target.value)}
                />
                <select
                  className="tt-input"
                  style={{ width: 100 }}
                  value={elType}
                  onChange={e => setElType(e.target.value)}
                >
                  {WORK_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={elVA}
                  onChange={e => setElVA(e.target.checked)}
                  className="accent-green-500"
                />
                Value Added
              </label>
              <button
                type="submit"
                disabled={loading || !elStation}
                className="tt-btn tt-btn-primary text-sm font-bold"
              >
                <Plus size={14} /> Add Element
              </button>
            </form>
          </div>
        </>
      )}

      {/* Production Order Management Section (Admin / Leader) */}
      {renderOrders && (
        <div className="border-t border-gray-800 pt-4 flex flex-col gap-4">
          <div>
            <p className="section-label mb-3 flex items-center gap-1.5">
              <Layers size={10} /> Production Orders
            </p>
            
            {isAdmin ? (
              <form onSubmit={createOrder} className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="tt-input"
                    placeholder="Order No (e.g. PO-2026-001)"
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                  />
                  <input
                    className="tt-input"
                    placeholder="Model (e.g. Corolla Hybrid)"
                    value={productModel}
                    onChange={e => setProductModel(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    className="tt-input flex-1"
                    type="number"
                    placeholder="Target Quantity"
                    value={targetQuantity}
                    onChange={e => setTargetQuantity(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={orderLoading || !orderNumber || !productModel}
                    className="tt-btn tt-btn-primary text-sm font-bold whitespace-nowrap"
                  >
                    Create Order
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-[11px] text-gray-500 mb-2">Only Administrators can create new production orders.</p>
            )}
          </div>

          {/* Orders List */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Order Registry</p>
            {orders.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-2">No orders created yet</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {orders.map(o => (
                  <div key={o.id} className="flex items-center justify-between text-xs p-2.5 rounded bg-gray-950/80 border border-gray-900">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{o.orderNumber}</span>
                        <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                          o.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                          o.status === 'COMPLETED' ? 'bg-cyan-500/20 text-cyan-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">{o.productModel} (Qty: {o.completedQuantity}/{o.targetQuantity})</p>
                    </div>
                    {o.status === 'PENDING' && (
                      <button
                        onClick={() => activateOrder(o.id)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-mono font-bold text-[10px] cursor-pointer transition-colors"
                      >
                        ACTIVATE
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Station list (Admin only) */}
      {renderStationList && stations.length > 0 && (
        <div className="border-t border-gray-800 pt-4">
          <p className="section-label mb-3">Stations ({stations.length})</p>
          <div className="flex flex-col gap-2">
            {stations.map((st) => (
              <div
                key={st.id}
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid #1f2937' }}
              >
                <button
                  onClick={() => toggleExpand(st.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-800 transition-colors"
                  style={{ background: '#0d1117' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{ background: '#4a6fa522', color: '#4a90d9', border: '1px solid #4a6fa533' }}
                    >
                      #{st.id}
                    </span>
                    <span className="text-sm font-semibold text-white">{st.name}</span>
                    <span className="text-xs text-gray-500">Takt: {st.taktTime}s</span>
                  </div>
                  {expanded[st.id] ? <ChevronDown size={14} color="#6b7280" /> : <ChevronRight size={14} color="#6b7280" />}
                </button>
                {expanded[st.id] && st.workElements && (
                  <div className="p-3 bg-gray-950 flex flex-col gap-1">
                    {st.workElements.length === 0 ? (
                      <p className="text-xs text-gray-600 text-center py-2">No elements yet</p>
                    ) : st.workElements.map((el, i) => (
                      <div
                        key={el.id}
                        className="flex items-center justify-between text-xs px-2 py-1.5 rounded"
                        style={{ background: '#111827' }}
                      >
                        <span className="text-gray-300 font-medium">{el.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-500">{el.standardDuration}s</span>
                          <span
                            className="px-1.5 py-0.5 rounded font-mono font-bold"
                            style={{
                              background: el.workType === 'MANUAL' ? '#00d4aa22' : el.workType === 'WORKING' ? '#f59e0b22' : el.workType === 'MACHINE' ? '#4a90d922' : '#ef444422',
                              color: el.workType === 'MANUAL' ? '#00d4aa' : el.workType === 'WORKING' ? '#f59e0b' : el.workType === 'MACHINE' ? '#4a90d9' : '#ef4444',
                            }}
                          >
                            {el.workType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
