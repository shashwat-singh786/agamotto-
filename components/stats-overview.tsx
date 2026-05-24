import { Camera, AlertTriangle, Eye, Wifi } from "lucide-react"
import { getSystemStats } from "@/lib/data"

export function StatsOverview() {
  const stats = getSystemStats();

  const cards = [
    {
      label: "Cameras Online",
      value: stats.onlineCameras,
      total: stats.totalCameras,
      icon: Camera,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Active Monitors",
      value: stats.totalCameras,
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Alerts",
      value: 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "System Status",
      value: "Live",
      icon: Wifi,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-slate-200 bg-white">
      {cards.map(({ label, value, total, icon: Icon, color, bg }) => (
        <div key={label} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-slate-900">
              {value}
              {total !== undefined && (
                <span className="text-sm font-normal text-slate-400"> / {total}</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
