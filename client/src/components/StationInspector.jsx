import { Users, Cpu, ShieldAlert, CheckCircle, Clock, Zap, Play } from 'lucide-react'
import YamazumiChart from './YamazumiChart'

const STATION_METADATA = {
  1: { operator: 'Ahmet Yılmaz', product: 'Corolla Hybrid', avatar: 'AY' },
  2: { operator: 'Mehmet Kaya', product: 'Corolla Hybrid', avatar: 'MK' },
  3: { operator: 'Ayşe Demir', product: 'RAV4 Plug-in', avatar: 'AD' },
  4: { operator: 'Mustafa Şahin', product: 'RAV4 Plug-in', avatar: 'MŞ' },
  5: { operator: 'Fatma Çelik', product: 'Yaris Cross', avatar: 'FÇ' },
  6: { operator: 'Ali Öztürk', product: 'Yaris Cross', avatar: 'AÖ' },
}

export default function StationInspector({ activeStationId, station, activeSim, alerts, running }) {
  const meta = STATION_METADATA[activeStationId] || { operator: 'Unknown Operator', product: 'Standard Chassis', avatar: '??' }
  const hasAlert = alerts.some(a => a.stationId === activeStationId && !a.resolved)

  const workTypeColors = {
    MANUAL: '#00d4aa',
    WORKING: '#f59e0b',
    WALKING: '#f59e0b',
    MACHINE: '#4a90d9',
    WAITING: '#ef4444',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT SIDE: Station Identity & Live Operator Metrics */}
      <div 
        className={`lg:col-span-5 glass-card p-6 flex flex-col gap-5 transition-all duration-500 ${
          hasAlert 
            ? 'border-2 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse-red-slow' 
            : 'border border-gray-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={18} className={hasAlert ? 'text-red-500' : 'text-cyan-400'} />
            <div>
              <p className="section-label mb-0.5">Station Twin</p>
              <h3 className="text-md font-bold text-white">Inspector Console</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${running ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-[10px] font-mono font-bold text-gray-500 tracking-wider">
              {running ? 'TELEMETRY LIVE' : 'SIMULATION IDLE'}
            </span>
          </div>
        </div>

        {/* Warning Alert Banner */}
        {hasAlert && (
          <div className="rounded-lg bg-red-950/40 border border-red-800/60 p-3 flex items-start gap-2.5 animate-flash-red">
            <ShieldAlert size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-200">ANDON ALERT ACTIVE</p>
              <p className="text-[11px] text-red-400 mt-0.5">
                Cycle time exceeded Takt limit. Immediate response required.
              </p>
            </div>
          </div>
        )}

        {/* Station Identity Section */}
        <div className="bg-gray-950/60 rounded-xl p-4 border border-gray-900 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-gray-600 uppercase">Selected Unit</span>
              <h4 className="text-lg font-black text-white tracking-wide">
                {station?.name || `Station ID: ${activeStationId}`}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-600 uppercase">Limit</span>
              <p className="text-sm font-bold text-red-500 font-mono">
                Takt: {station?.taktTime || 60}s
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-1 border-t border-gray-900 pt-3">
            <div>
              <span className="text-[10px] font-mono text-gray-600">Product Model</span>
              <p className="text-xs font-semibold text-gray-200 mt-0.5">{meta.product}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-600">Active Shift</span>
              <p className="text-xs font-semibold text-gray-200 mt-0.5">Morning (08:00 - 16:00)</p>
            </div>
          </div>
        </div>

        {/* Active Operator Metrics */}
        <div className="bg-gray-950/60 rounded-xl p-4 border border-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-xs font-bold text-cyan-400">
            {meta.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-gray-600">Active Station Operator</span>
              <div className="flex items-center gap-1 text-[10px] text-green-400 font-mono">
                <Users size={10} /> Certified
              </div>
            </div>
            <p className="text-sm font-bold text-white truncate mt-0.5">{meta.operator}</p>
          </div>
        </div>

        {/* Live Element Progress Bar */}
        <div className="flex-1 flex flex-col justify-center">
          {running && activeSim?.currentEl ? (
            <div className="bg-gray-950/60 rounded-xl p-4 border border-gray-900 flex flex-col gap-3 animate-fade-in">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-gray-600 uppercase flex items-center gap-1">
                    <Zap size={10} className="text-yellow-500 animate-pulse" />
                    Executing Job Element
                  </span>
                  <p className="text-xs font-bold text-white mt-1 leading-snug">
                    {activeSim.currentEl.name}
                  </p>
                </div>
                <span 
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ 
                    background: `${workTypeColors[activeSim.currentEl.workType] || '#4a6fa5'}20`,
                    color: workTypeColors[activeSim.currentEl.workType] || '#4a6fa5'
                  }}
                >
                  {activeSim.currentEl.workType}
                </span>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 mb-1.5 font-mono">
                  <span>Standard: {activeSim.currentEl.standardDuration}s</span>
                  <span className="font-bold text-cyan-400">{activeSim.elProgress}%</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-100"
                    style={{ width: `${activeSim.elProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 border-t border-gray-900/60 pt-2.5">
                <span className="flex items-center gap-1">
                  <Clock size={10} /> Cycle Total
                </span>
                <span className="font-bold text-gray-300">
                  {activeSim.totalTime > 0 ? `${activeSim.totalTime}s` : 'Calculating...'}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-800 p-6 text-center bg-gray-950/20 flex flex-col items-center justify-center gap-2.5">
              <Play size={24} className="text-gray-700 animate-pulse" />
              <div>
                <p className="text-xs font-bold text-gray-400">Twin Simulation Offline</p>
                <p className="text-[10px] text-gray-600 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Start the Parallel Simulator to stream live telemetry data from this station.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Yamazumi Chart */}
      <div className="lg:col-span-7">
        <YamazumiChart activeStationId={activeStationId} />
      </div>

    </div>
  )
}
