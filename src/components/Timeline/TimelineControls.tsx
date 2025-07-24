"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

interface TimelineControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onScrollLeft: () => void
  onScrollRight: () => void
}

export const TimelineControls = ({ onZoomIn, onZoomOut, onScrollLeft, onScrollRight }: TimelineControlsProps) => {
  return (
    <>
      {/* Zoom Controls - Below Timeline Ruler */}
      <div className="absolute top-16 right-4 flex space-x-2 z-10">
        <button
          onClick={onZoomOut}
          className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 hover:shadow-lg transition-all duration-200 active:scale-95 select-none"
          title="Zoom Out"
        >
          <span className="text-lg font-bold text-slate-600 select-none">-</span>
        </button>
        <button
          onClick={onZoomIn}
          className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 hover:shadow-lg transition-all duration-200 active:scale-95 select-none"
          title="Zoom In"
        >
          <span className="text-lg font-bold text-slate-600 select-none">+</span>
        </button>
      </div>

      {/* Navigation Controls - Left and Right */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10" onClick={onScrollLeft}>
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 select-none">
          <ChevronLeftIcon size={20} />
        </button>
      </div>
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10" onClick={onScrollRight}>
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 select-none">
          <ChevronRightIcon size={20} />
        </button>
      </div>
    </>
  )
}
