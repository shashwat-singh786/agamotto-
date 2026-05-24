"use client"

import { Button } from "@/components/ui/button"
import { Clock, AlertTriangle, Shield, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react"
import type { Timestamp } from "@/app/types"
import { useState, useEffect, useRef } from "react"

interface TimestampListProps {
  timestamps: Timestamp[]
  onTimestampClick: (timestamp: string) => void
}

export default function TimestampList({ timestamps, onTimestampClick }: TimestampListProps) {
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [longDescriptions, setLongDescriptions] = useState<number[]>([])
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([])

  useEffect(() => {
    const checkTextOverflow = () => {
      const longItems = timestamps
        .map((_, index) => {
          const textElement = textRefs.current[index]
          if (!textElement) return { index, hasOverflow: false }

          // Check if the element has overflow and ellipsis
          const hasOverflow = (
            textElement.offsetWidth < textElement.scrollWidth ||
            textElement.offsetHeight < textElement.scrollHeight
          )
          
          return { index, hasOverflow }
        })
        .filter(({ hasOverflow }) => hasOverflow)
        .map(({ index }) => index)

      setLongDescriptions(longItems)
    }

    // Check after a short delay to ensure rendering is complete
    const timeoutId = setTimeout(checkTextOverflow, 100)

    // Recheck on window resize
    const handleResize = () => {
      clearTimeout(timeoutId)
      setTimeout(checkTextOverflow, 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [timestamps])

  const toggleExpand = (index: number, e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    setExpandedItems(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }
  return (
    <div className="grid gap-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-slate-900">Key Moments</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-slate-500">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <span className="text-slate-500">Suspicious</span>
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        {timestamps.map((item, index) => (
          <Button
            key={index}
            variant="outline"
            className={`group w-full justify-start gap-2 h-auto py-4 transition-all duration-200 ${
              item.isDangerous
                ? 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300'
                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            } text-left relative overflow-hidden`}
            onClick={() => onTimestampClick(item.timestamp)}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 ${
              item.isDangerous
                ? 'bg-red-500 group-hover:bg-red-400'
                : 'bg-green-500 group-hover:bg-green-400'
            }`} />
            {item.isDangerous ? (
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
            ) : (
              <Shield className="h-4 w-4 shrink-0 text-green-600" />
            )}
            <div className="flex flex-col items-start w-full overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap w-full">
                <span className="font-mono text-slate-900 shrink-0">{item.timestamp}</span>
                {item.isDangerous ? (
                  <span className="badge-suspicious shrink-0">SUSPICIOUS</span>
                ) : (
                  <span className="badge-safe shrink-0">SAFE</span>
                )}
              </div>
              <div className="w-full mt-1.5">
                <div 
                  className={`relative text-sm transition-all duration-200 ${longDescriptions.includes(index) ? 'cursor-pointer' : ''}`}
                  onClick={(e: React.MouseEvent) => longDescriptions.includes(index) && toggleExpand(index, e)}
                >
                  <p
                    ref={(el) => { textRefs.current[index] = el }}
                    className={`whitespace-pre-wrap break-words ${expandedItems.includes(index) ? '' : 'line-clamp-1'} ${
                    item.isDangerous ? 'text-red-600' : 'text-slate-500'
                  }`}>
                    {item.description}
                  </p>
                  {longDescriptions.includes(index) && (
                    <div 
                      role="button"
                      tabIndex={0}
                      onClick={(e: React.MouseEvent) => toggleExpand(index, e)}
                      onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && toggleExpand(index, e)}
                      className={`flex items-center gap-1 text-xs mt-1 cursor-pointer ${item.isDangerous ? 'text-red-500 hover:text-red-400' : 'text-slate-400 hover:text-slate-600'} transition-colors`}
                    >
                      {expandedItems.includes(index) ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Show more
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}
