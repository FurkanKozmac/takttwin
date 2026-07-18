import { useState, useEffect } from 'react'
import api from '../api/axios'
import { ShieldAlert, CheckCircle, Clock, User } from 'lucide-react'

export default function AlarmHistoryPanel() {
  const [data, setData] = useState({ mttrSeconds: 0, totalResolvedAlertCount: 0, resolvedAlertsList: [] })
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    try {
      const response = await api.get('/andon/history')
      setData(response.data)
    } catch (err) {
      // Handle error quietly or show fallback
    } finally {
      setLoading(false)
    }
  }

  const fetchStations = async () => {
    try {
      const response = await api.get('/stations')
      setStations(response.data)
    } catch (err) {}
  }

  useEffect(() => {
    fetchStations()
    fetchHistory()
    const interval = setInterval(fetchHistory, 3000)
    return () => clearInterval(interval)
  }, [])

  const getStationName = (stationId) => {
    const s = stations.find(item => item.id === stationId)
    return s ? s.name : `Station #${stationId}`
  }

  const formatDowntime = (seconds) => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }

  return (
    <div className="bg-slate-900 p-6 rounded border border-slate-800 shadow-md w-full animate-fade-in flex flex-col gap-6">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert size={18} className="text-rose-500" />
          Alarm History & Maintenance MTTR Dashboard
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Historical overview of all resolved Andon line alerts and Mean Time To Resolution (MTTR) performance metrics.
        </p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MTTR Card */}
        <div className="bg-slate-950 p-5 rounded border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">Mean Time To Resolution (MTTR)</p>
            <p className="text-3xl font-black text-rose-500 font-mono mt-1.5">
              {data.mttrSeconds ? data.mttrSeconds.toFixed(1) : '0.0'}s
            </p>
            <p className="text-[9px] text-slate-400 mt-1">Average incident resolution duration</p>
          </div>
          <div className="bg-slate-900 p-3 rounded border border-slate-850 text-rose-500">
            <Clock size={24} />
          </div>
        </div>

        {/* Total Closed Incidents Card */}
        <div className="bg-slate-950 p-5 rounded border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">Total Closed Incidents</p>
            <p className="text-3xl font-black text-emerald-400 font-mono mt-1.5">
              {data.totalResolvedAlertCount || 0}
            </p>
            <p className="text-[9px] text-slate-400 mt-1">Total resolved Andon alerts</p>
          </div>
          <div className="bg-slate-900 p-3 rounded border border-slate-850 text-emerald-400">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Resolved Alarms Table */}
      <div className="flex flex-col">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-3">
          Resolved Alerts Register
        </h4>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-500 font-mono">Loading history...</div>
        ) : data.resolvedAlertsList.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 p-8 rounded text-center text-slate-500 font-mono text-xs">
            No resolved Andon alert records found in the database.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded bg-slate-950">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase font-mono bg-slate-900/50">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Station</th>
                  <th className="px-4 py-3">Cycle #</th>
                  <th className="px-4 py-3">Downtime</th>
                  <th className="px-4 py-3">Resolved By</th>
                  <th className="px-4 py-3">Resolution Comment</th>
                  <th className="px-4 py-3 text-right">Resolved At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50 font-mono text-xs text-slate-300">
                {data.resolvedAlertsList.map((alert) => {
                  // Calculate downtime for this specific alert
                  const diffSeconds = alert.createdAt && alert.resolvedAt
                    ? (new Date(alert.resolvedAt) - new Date(alert.createdAt)) / 1000
                    : 0;

                  return (
                    <tr key={alert.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500">#{alert.id}</td>
                      <td className="px-4 py-3 font-bold text-white">{getStationName(alert.stationId)}</td>
                      <td className="px-4 py-3">Cycle {alert.cycleNumber}</td>
                      <td className="px-4 py-3 text-rose-400 font-bold">{formatDowntime(diffSeconds)}</td>
                      <td className="px-4 py-3 flex items-center gap-1.5">
                        <User size={12} className="text-slate-500" />
                        <span>{alert.resolvedBy || 'System'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 italic">
                        {alert.resolutionComment || 'No comment provided.'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-[10px]">
                        {new Date(alert.resolvedAt).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
