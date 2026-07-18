import { useState, useCallback, useEffect } from 'react'
import api from '../api/axios'
import { usePolling } from '../hooks/usePolling'
import { useAuth } from '../context/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, RefreshCw, Info } from 'lucide-react'

const STATION_ID  = 1
const TAKT_TIME   = 60

const WORK_TYPE_COLORS = {
  VA:    '#00d4aa',
  NVA:   '#ef4444',
  RNVA:  '#f59e0b',
  default: '#4a6fa5',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#111827',
        border: '1px solid #374151',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <p style={{ color: '#fff', fontWeight: 700, marginBottom: 6, fontSize: 13 }}>{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 2,
            background: p.fill, display: 'inline-block', flexShrink: 0
          }} />
          <span style={{ color: '#9ca3af', fontSize: 12 }}>{p.name}:</span>
          <span style={{ color: p.fill, fontWeight: 600, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
            {typeof p.value === 'number' ? `${p.value.toFixed(2)}s` : p.value}
          </span>
        </div>
      ))}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #374151' }}>
        <span style={{ color: '#6b7280', fontSize: 11 }}>Takt Time: </span>
        <span style={{ color: '#ff3b3b', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' }}>
          {TAKT_TIME}s
        </span>
      </div>
    </div>
  )
}

const CustomLegend = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 2, background: '#4a6fa5', display: 'inline-block' }} />
      <span style={{ color: '#9ca3af', fontSize: 12 }}>Standard Duration</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 2, background: '#00d4aa', display: 'inline-block' }} />
      <span style={{ color: '#9ca3af', fontSize: 12 }}>Avg Actual Duration</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 24, height: 2, borderTop: '2px dashed #ff3b3b', display: 'inline-block' }} />
      <span style={{ color: '#ff3b3b', fontSize: 12 }}>Takt Time (60s)</span>
    </div>
  </div>
)

export default function YamazumiChart({ activeStationId = 1 }) {
  const { user }            = useAuth()
  const [data, setData]     = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const { data: raw } = await api.get(`/stations/${activeStationId}/yamazumi`)
      const formatted = (Array.isArray(raw) ? raw : []).map(item => ({
        name: item.elementName?.length > 14
          ? item.elementName.substring(0, 13) + '…'
          : (item.elementName || `El. ${item.elementId}`),
        fullName:         item.elementName,
        standard:         parseFloat((item.standardDuration   || 0).toFixed(2)),
        actual:           parseFloat((item.averageActualDuration || 0).toFixed(2)),
        workType:         item.workType || 'VA',
        isValueAdded:     item.isValueAdded,
        elementId:        item.elementId,
      }))
      setData(formatted)
      setLastUpdated(new Date())
    } catch {
      // Silently fail — station may not exist yet
    } finally {
      setLoading(false)
    }
  }, [activeStationId])

  useEffect(() => {
    fetchData()
    const handleRefresh = () => fetchData()
    window.addEventListener('yamazumi-refresh', handleRefresh)
    return () => window.removeEventListener('yamazumi-refresh', handleRefresh)
  }, [fetchData])

  const totalStandard = data.reduce((s, d) => s + d.standard, 0)
  const totalActual   = data.reduce((s, d) => s + d.actual,   0)
  const overTakt      = totalActual > TAKT_TIME

  return (
    <div className="glass-card p-6 flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="section-label mb-1">Live Line Balancing</p>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={18} color="#00d4aa" />
            Yamazumi Chart — Station ID: {activeStationId}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs font-mono text-gray-600 flex items-center gap-1">
              <RefreshCw size={10} />
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {data.length > 0 && (
            <div
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
              style={{
                background: overTakt ? '#1a080844' : '#00120844',
                border: `1px solid ${overTakt ? '#ef444466' : '#10b98144'}`,
                color: overTakt ? '#ef4444' : '#10b981',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: overTakt ? '#ef4444' : '#10b981' }}
              />
              Σ Actual: {totalActual.toFixed(1)}s
              {overTakt ? ' ▲ OVER TAKT' : ' ✓ OK'}
            </div>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="section-label mb-1">Σ Standard</p>
            <p className="text-lg font-bold font-mono" style={{ color: '#4a6fa5' }}>
              {totalStandard.toFixed(1)}s
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="section-label mb-1">Σ Actual</p>
            <p
              className="text-lg font-bold font-mono"
              style={{ color: overTakt ? '#ef4444' : '#00d4aa' }}
            >
              {totalActual.toFixed(1)}s
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <p className="section-label mb-1">Takt Time</p>
            <p className="text-lg font-bold font-mono" style={{ color: '#ff3b3b' }}>
              {TAKT_TIME}s
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ minHeight: 340 }}>
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
            <span className="animate-spin-slow mr-2">⚙</span> Loading chart data...
          </div>
        ) : data.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-64 gap-3 rounded-xl"
            style={{ background: '#0d1117', border: '1px dashed #1f2937' }}
          >
            <Info size={32} color="#374151" />
            <p className="text-gray-500 text-sm text-center">
              No Yamazumi data available yet.<br/>
              Create station elements and run the simulation to see data.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
              barCategoryGap="25%"
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="name"
                tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                tickLine={false}
                axisLine={{ stroke: '#1f2937' }}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}s`}
                domain={[0, Math.max(TAKT_TIME * 1.3, totalActual * 1.2, 10)]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

              {/* Standard bars - steel blue */}
              <Bar dataKey="standard" name="Standard Duration" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`std-${index}`}
                    fill="#4a6fa5"
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>

              {/* Actual bars - color by work type */}
              <Bar dataKey="actual" name="Avg Actual Duration" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => {
                  const color = entry.actual > TAKT_TIME / data.length * 1.5
                    ? '#ef4444'
                    : WORK_TYPE_COLORS[entry.workType] || WORK_TYPE_COLORS.default
                  return <Cell key={`act-${index}`} fill={color} fillOpacity={0.9} />
                })}
              </Bar>

              {/* Takt time reference line */}
              <ReferenceLine
                y={TAKT_TIME}
                stroke="#ff3b3b"
                strokeDasharray="6 3"
                strokeWidth={2}
                label={{
                  value: `Takt: ${TAKT_TIME}s`,
                  position: 'insideTopRight',
                  fill: '#ff3b3b',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      {data.length > 0 && <CustomLegend />}

      {/* Work type legend */}
      {data.length > 0 && (
        <div
          className="rounded-lg p-3 flex flex-wrap gap-3"
          style={{ background: '#0d1117', border: '1px solid #1f2937' }}
        >
          <span className="section-label self-center">Work Types:</span>
          {Object.entries({ VA: 'Value Added', NVA: 'Non-Value Added', RNVA: 'Required Non-VA' }).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ background: WORK_TYPE_COLORS[k] }}
              />
              <span className="font-mono font-bold" style={{ color: WORK_TYPE_COLORS[k] }}>{k}</span>
              <span className="text-gray-600">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
