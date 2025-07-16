"use client"
import { useTimelineStore } from "../../store/timelineStore"
import { ZoomLevel } from "./TimelineCanvas"
import { CalendarIcon, ArrowRightIcon, LayoutIcon, ImageIcon, SlidersIcon, MenuIcon } from "lucide-react"

export const TimelineToolbar = ({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void
}) => {
  const { addEvent, addSpan } = useTimelineStore()

  const handleAddEvent = () => {
    const timelineConfig = (window as any).timelineConfig
    if (timelineConfig && timelineConfig.getCurrentViewportCenter) {
      const { date, x } = timelineConfig.getCurrentViewportCenter()
      addEvent({
        id: `event-${Date.now()}`,
        title: `🌿 New Nature Event`,
        description: "A significant moment in the natural world.",
        date: date.toISOString(),
        x: x,
        y: 100, // Default y position
        color: "#10b981", // green
      })
    } else {
      // Fallback to today if timelineConfig is not available
      const today = new Date()
      addEvent({
        id: `event-${Date.now()}`,
        title: `🌿 New Nature Event`,
        description: "A significant moment in the natural world.",
        date: today.toISOString(),
        x: 0,
        y: 100,
        color: "#10b981", // green
      })
    }
  }

  const handleAddSpan = () => {
    const timelineConfig = (window as any).timelineConfig
    if (timelineConfig && timelineConfig.getCurrentViewportCenter) {
      const { date, x } = timelineConfig.getCurrentViewportCenter()
      const endDate = new Date(date)
      endDate.setDate(date.getDate() + 30) // 30 days duration

      const endX = timelineConfig.calculateDatePosition ? timelineConfig.calculateDatePosition(endDate) : x + 30 * 100 // fallback calculation

      const width = endX - x

      addSpan({
        id: `span-${Date.now()}`,
        title: `🌱 New Natural Period`,
        description: "A period of natural activity or seasonal change.",
        startDate: date.toISOString(),
        endDate: endDate.toISOString(),
        x: x,
        y: 200, // Default y position
        width: width,
        color: "#8b5cf6", // purple
      })
    } else {
      // Fallback to today if timelineConfig is not available
      const today = new Date()
      const endDate = new Date()
      endDate.setDate(today.getDate() + 30)

      addSpan({
        id: `span-${Date.now()}`,
        title: `🌱 New Natural Period`,
        description: "A period of natural activity or seasonal change.",
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
        x: 0,
        y: 200,
        width: 3000, // fallback width
        color: "#8b5cf6", // purple
      })
    }
  }

  const handleSetPresetZoom = (level: ZoomLevel) => {
    const timelineConfig = (window as any).timelineConfig
    if (timelineConfig && timelineConfig.setPresetZoom) {
      timelineConfig.setPresetZoom(level)
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
      <div className="flex items-center space-x-1">
        <button onClick={onOpenSidebar} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <MenuIcon size={18} />
        </button>
        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        <button
          onClick={handleAddEvent}
          className="flex items-center space-x-1 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
        >
          <CalendarIcon size={16} />
          <span>Event</span>
        </button>
        <button
          onClick={handleAddSpan}
          className="flex items-center space-x-1 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 rounded-md"
        >
          <ArrowRightIcon size={16} />
          <span>Span</span>
        </button>
        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <LayoutIcon size={16} />
        </button>
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <ImageIcon size={16} />
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 border border-slate-200 rounded-md p-1">
          <button
            onClick={() => handleSetPresetZoom(ZoomLevel.Days)}
            className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded-sm"
          >
            Day
          </button>
          <button
            onClick={() => handleSetPresetZoom(ZoomLevel.Months)}
            className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded-sm"
          >
            Month
          </button>
          <button
            onClick={() => handleSetPresetZoom(ZoomLevel.Years)}
            className="px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded-sm"
          >
            Year
          </button>
        </div>
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <SlidersIcon size={16} />
        </button>
      </div>
    </div>
  )
}
