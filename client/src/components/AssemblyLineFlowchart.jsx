import { Factory, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react'

export default function AssemblyLineFlowchart({ stations, activeStationId, onSelectStation, alerts }) {
  
  const getStationStatus = (stationId) => {
    const hasUnresolvedAlert = alerts.some(alert => alert.stationId === stationId && !alert.resolved)
    return hasUnresolvedAlert ? 'ALARM' : 'OK'
  }

  return (
    <div className="glass-card p-6 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label mb-1">Live Tracking</p>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Factory size={18} color="#00d4aa" />
            Assembly Line Live Status
          </h2>
        </div>
        <div className="text-xs text-gray-500 font-mono">
          Click a station to inspect details
        </div>
      </div>

      {/* Sequential flowchart */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 pb-4 scrollbar-thin">
        {stations.map((st, idx) => {
          const status = getStationStatus(st.id)
          const isSelected = activeStationId === st.id
          const isAlarm = status === 'ALARM'

          return (
            <div key={st.id} className="flex items-center gap-2 flex-shrink-0">
              {/* Station Card */}
              <button
                onClick={() => onSelectStation(st.id)}
                className={`text-left p-4 rounded-xl transition-all duration-300 cursor-pointer min-w-[200px] flex-shrink-0 relative ${
                  isAlarm 
                    ? 'animate-flash-red border-2' 
                    : isSelected 
                      ? 'bg-gray-900 border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,212,170,0.25)]' 
                      : 'bg-gray-900/50 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-gray-500">
                    STATION #{st.id}
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isAlarm ? 'bg-red-400' : 'bg-green-400'
                    }`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      isAlarm ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide truncate">{st.name}</h3>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">
                  Takt: {st.taktTime}s
                </p>
                {isAlarm && (
                  <div className="absolute -bottom-2 -right-2 bg-red-600 text-white rounded-full p-1 border border-black animate-bounce">
                    <AlertTriangle size={10} />
                  </div>
                )}
              </button>

              {/* Connector Arrow */}
              {idx < stations.length - 1 && (
                <div className="flex items-center justify-center text-gray-700 px-1">
                  <ArrowRight size={16} className="text-gray-700 animate-pulse" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
