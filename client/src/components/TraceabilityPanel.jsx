import { useState } from 'react'
import api from '../api/axios'
import { Search, Info, ShieldAlert, CheckCircle, PlayCircle, Clock, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { useAuth } from '../context/AuthContext'

export default function TraceabilityPanel() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const response = await api.get(`/vehicles/${query.trim()}/traceability`)
      setData(response.data)
    } catch (err) {
      setData(null)
      toast.error(err.response?.data?.message || 'Vehicle not found or no assembly data yet.')
    } finally {
      setLoading(false)
    }
  }

  const exportPDF = async () => {
    if (!data) return

    const toastId = toast.loading('Generating Quality Certificate PDF...')

    // Create hidden print container
    const printArea = document.createElement('div')
    printArea.style.position = 'fixed'
    printArea.style.left = '-9999px'
    printArea.style.top = '0'
    printArea.style.width = '700px'
    printArea.style.background = '#ffffff'
    printArea.style.color = '#0f172a'
    printArea.style.fontFamily = 'monospace'
    printArea.style.padding = '40px'
    printArea.style.boxSizing = 'border-box'
    
    // Header
    const header = document.createElement('div')
    header.style.borderBottom = '2px double #0f172a'
    header.style.paddingBottom = '12px'
    header.style.marginBottom = '25px'
    header.style.textAlign = 'center'
    header.innerHTML = `
      <h2 style="margin: 0; font-size: 18px; font-weight: bold; letter-spacing: 1px; color: #0f172a;">TAKT_TWIN - VEHICLE QUALITY & TRACEABILITY CERTIFICATE</h2>
      <p style="margin: 6px 0 0 0; font-size: 10px; color: #64748b;">Industrial Digital Twin Manufacturing Execution System v2.5</p>
    `
    printArea.appendChild(header)

    // Metadata
    const meta = document.createElement('div')
    meta.style.display = 'grid'
    meta.style.gridTemplateColumns = '1fr 1fr'
    meta.style.gap = '20px'
    meta.style.marginBottom = '30px'
    meta.style.fontSize = '12px'
    meta.style.lineHeight = '1.6'
    meta.innerHTML = `
      <div>
        <p style="margin: 3px 0; color: #0f172a;"><strong>Vehicle Serial:</strong> #${data.serialNumber}</p>
        <p style="margin: 3px 0; color: #0f172a;"><strong>Product Model:</strong> ${data.productModel}</p>
        <p style="margin: 3px 0; color: #0f172a;"><strong>Current Status:</strong> <span style="font-weight: bold; color: ${data.status === 'COMPLETED' ? '#10b981' : '#f59e0b'};">${data.status}</span></p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 3px 0; color: #0f172a;"><strong>Assembly Started:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
        ${data.completedAt ? `<p style="margin: 3px 0; color: #0f172a;"><strong>Assembly Finished:</strong> ${new Date(data.completedAt).toLocaleString()}</p>` : ''}
      </div>
    `
    printArea.appendChild(meta)

    // Timeline title
    const title = document.createElement('h3')
    title.style.fontSize = '12px'
    title.style.fontWeight = 'bold'
    title.style.borderBottom = '1px solid #e2e8f0'
    title.style.paddingBottom = '6px'
    title.style.marginBottom = '20px'
    title.style.color = '#475569'
    title.innerText = 'CHRONOLOGICAL ASSEMBLY TIMELINE'
    printArea.appendChild(title)

    // Timeline steps
    const stepsContainer = document.createElement('div')
    stepsContainer.style.display = 'flex'
    stepsContainer.style.flexDirection = 'column'
    stepsContainer.style.gap = '15px'

    data.timeline.forEach((step) => {
      const stepEl = document.createElement('div')
      stepEl.style.border = '1px solid #e2e8f0'
      stepEl.style.padding = '12px'
      stepEl.style.borderRadius = '6px'
      stepEl.style.fontSize = '11px'
      stepEl.style.backgroundColor = '#f8fafc'
      
      if (step.triggeredAlert) {
        stepEl.style.borderColor = '#fca5a5'
        stepEl.style.backgroundColor = '#fef2f2'
      }

      stepEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 6px; color: #0f172a;">
          <span>[${step.stationName}] - ${step.workElementName}</span>
          <span style="color: #64748b; font-weight: normal;">${new Date(step.timestamp).toLocaleTimeString()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #334155; font-size: 10px;">
          <span>Duration: ${step.actualDuration}s (Type: ${step.workType})</span>
          ${step.triggeredAlert ? '<span style="color: #ef4444; font-weight: bold;">⚠️ Quality Incident / Line Stop Resolved</span>' : ''}
        </div>
      `
      stepsContainer.appendChild(stepEl)
    })
    printArea.appendChild(stepsContainer)

    // Inspector Signature stamp placeholder
    const signature = document.createElement('div')
    signature.style.marginTop = '50px'
    signature.style.paddingTop = '20px'
    signature.style.borderTop = '1px dashed #cbd5e1'
    signature.style.display = 'flex'
    signature.style.justifyContent = 'space-between'
    signature.style.alignItems = 'center'
    signature.style.fontSize = '11px'
    signature.innerHTML = `
      <div>
        <p style="margin: 0 0 6px 0; color: #0f172a;"><strong>Authorized Quality Inspector:</strong></p>
        <p style="margin: 0; color: #475569; font-family: monospace;">${user?.email || 'System'}</p>
      </div>
      <div style="text-align: center; width: 160px; border: 2px solid #64748b; padding: 12px; border-radius: 6px; font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; background: #f8fafc;">
        Quality Approved<br>
        <span style="font-size: 8px; color: #94a3b8; font-weight: normal; margin-top: 4px; display: block;">TaktTwin Certification</span>
      </div>
    `
    printArea.appendChild(signature)

    document.body.appendChild(printArea)

    try {
      const canvas = await html2canvas(printArea, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`Traceability_Certificate_SH-${data.serialNumber}.pdf`)
      toast.success('Quality Certificate Exported Successfully!', { id: toastId })
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF.', { id: toastId })
    } finally {
      document.body.removeChild(printArea)
    }
  }

  return (
    <div className="bg-slate-900 p-6 rounded border border-slate-800 shadow-md w-full animate-fade-in">
      <div className="border-b border-slate-800 pb-4 mb-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Search size={18} className="text-emerald-400" />
          Vehicle Genealogy & WIP Traceability
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Search a vehicle's serial number (e.g. cycle number) to view its complete real-time assembly history.
        </p>
      </div>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter Vehicle Serial (e.g., 6, 12, 18)"
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="tt-btn tt-btn-primary px-5 flex items-center gap-2"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Results Rendering */}
      {data ? (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Header Summary Card */}
          <div className="bg-slate-950 border border-slate-800 p-5 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Vehicle Track</span>
                <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                  data.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {data.status}
                </span>
              </div>
              <h4 className="text-xl font-black text-white font-mono">
                Vehicle Serial: #{data.serialNumber}
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Model: <span className="text-white">{data.productModel}</span>
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3">
              <button
                onClick={exportPDF}
                className="tt-btn border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 px-4 py-2.5 flex items-center gap-2 text-xs font-bold transition-all cursor-pointer rounded"
              >
                <FileDown size={14} /> Export Quality Certificate (PDF)
              </button>
              <div className="text-left md:text-right font-mono text-xs text-slate-400 flex flex-col gap-1">
                {data.currentStationName && (
                  <div className="flex items-center md:justify-end gap-1.5 text-amber-400">
                    <PlayCircle size={14} />
                    <span>WIP Active at: <span className="font-bold text-white">{data.currentStationName}</span></span>
                  </div>
                )}
                <div>
                  <span>Started: </span>
                  <span className="text-white">{new Date(data.createdAt).toLocaleString()}</span>
                </div>
                {data.completedAt && (
                  <div className="text-emerald-400 flex items-center md:justify-end gap-1.5">
                    <CheckCircle size={14} />
                    <span>Finished: <span className="text-white">{new Date(data.completedAt).toLocaleString()}</span></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Rendering */}
          <div>
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-4">
              Assembly History Logs ({data.timeline.length} operations)
            </h5>

            {data.timeline.length === 0 ? (
              <div className="bg-slate-950 p-6 rounded border border-slate-800 text-center text-slate-500 text-sm">
                <Info size={20} className="mx-auto mb-2 text-slate-600" />
                No assembly operations recorded yet for this vehicle.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-800 ml-3 flex flex-col gap-6">
                {data.timeline.map((step, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle marker */}
                    <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      step.triggeredAlert
                        ? 'bg-rose-950 border-rose-500 animate-pulse'
                        : 'bg-slate-950 border-emerald-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        step.triggeredAlert ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                    </span>

                    {/* Operation details block */}
                    <div className={`p-4 rounded border transition-colors ${
                      step.triggeredAlert
                        ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                            step.triggeredAlert
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {step.stationName}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {step.workElementName}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono mt-3">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock size={12} />
                          <span>Duration: <span className="font-bold text-white">{step.actualDuration}s</span></span>
                        </div>
                        <span className="text-slate-500 text-[10px]">
                          Type: {step.workType}
                        </span>
                      </div>

                      {step.triggeredAlert && (
                        <div className="mt-3 flex items-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase tracking-wider bg-rose-500/5 p-2 rounded border border-rose-500/10 animate-fade-in">
                          <ShieldAlert size={12} />
                          <span>Andon Alert Triggered: Cycle time exceeded target Takt Time!</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 p-8 rounded text-center text-slate-500">
          <Search size={32} className="mx-auto mb-3 text-slate-700" />
          <p className="text-sm font-medium">No genealogy trace displayed.</p>
          <p className="text-xs text-slate-600 mt-1">
            Search a valid vehicle serial (e.g. 1, 2, 3...) to draw the complete traceability genealogy graph.
          </p>
        </div>
      )}
    </div>
  )
}
