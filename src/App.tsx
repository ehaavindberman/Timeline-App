"use client"

import type React from "react"
import { useState, useRef } from "react"
import { TimelineCanvas } from "./components/Timeline/TimelineCanvas"
import { TimelineToolbar } from "./components/Timeline/TimelineToolbar"
import { useTimelineStore } from "./store/timelineStore" // Import useTimelineStore
import { exportToCsv, importFromCsv } from "./utils/csvUtils" // Import CSV utilities
import { TimelineSidebar } from "./components/Timeline/TimelineSidebar"
export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { events, spans, setEvents, setSpans } = useTimelineStore() // Get events, spans, and setters
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleExport = () => {
    try {
      console.log("Exporting timeline data:", { events, spans })
      const csv = exportToCsv(events, spans)
      console.log("Generated CSV:", csv)

      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      })

      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `timeline_data_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log("Export completed successfully")
    } catch (error) {
      console.error("Error exporting CSV:", error)
      alert("Failed to export timeline data. Please try again.")
    }
  }
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csvString = e.target?.result as string
          const { events: importedEvents, spans: importedSpans } = importFromCsv(csvString)
          setEvents(importedEvents)
          setSpans(importedSpans)
          alert("Timeline data imported successfully!")
        } catch (error) {
          console.error("Error importing CSV:", error)
          alert("Failed to import CSV. Please check the file format.")
        }
      }
      reader.readAsText(file)
    }
  }
  return (
    <div className="flex flex-col w-full h-screen bg-slate-50 overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-medium text-slate-800">Timeline Builder</h1>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Beta</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Share
          </button>
          <button
            onClick={handleImportClick}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
          >
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            style={{
              display: "none",
            }}
          />
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-100 transition-colors"
          >
            Export
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <TimelineSidebar onClose={() => setSidebarOpen(false)} />}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TimelineToolbar onOpenSidebar={() => setSidebarOpen(true)} />
          <TimelineCanvas />
        </div>
      </div>
    </div>
  )
}
