"use client"

import Link from "next/link"
import { Video, PlaySquare, FolderOpen, BarChart2 } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/pages/upload", icon: Video, label: "Upload" },
  { href: "/pages/realtimeStreamPage", icon: PlaySquare, label: "Realtime" },
  { href: "/pages/saved-videos", icon: FolderOpen, label: "Library" },
  { href: "/pages/statistics", icon: BarChart2, label: "Statistics" },
]

export function HeaderNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
              isActive
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
