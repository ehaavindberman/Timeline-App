"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useTimelineStore } from "../../store/timelineStore"
import type { ZoomLevel } from "./TimelineCanvas"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

type TimelineEventProps = {
  event: {
    id: string
    title: string
    description: string
    date: string
    x: number
    y: number
    color: string
  }
  calculateDatePosition: (date: Date) => number
  zoomLevel: ZoomLevel
}

export const TimelineEvent = ({ event, calculateDatePosition, zoomLevel }: TimelineEventProps) => {
  const { updateEvent, selectElement, selectedElementId } = useTimelineStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isDateLocked, setIsDateLocked] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [position, setPosition] = useState({
    x: event.x,
    y: event.y,
  })

  // Update position based on date when zoom level changes (only x position)
  useEffect(() => {
    const eventDate = new Date(event.date)
    const xPos = calculateDatePosition(eventDate)
    setPosition((prev) => ({
      x: xPos,
      y: prev.y, // Keep the y position unchanged
    }))
  }, [event.date, zoomLevel, calculateDatePosition])

  // Update y position when event.y changes
  useEffect(() => {
    setPosition((prev) => ({
      ...prev,
      y: event.y,
    }))
  }, [event.y])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault() // Prevent text selection
    setIsDragging(true)
    setStartX(e.clientX)
    setStartY(e.clientY)
    selectElement(event.id)

    // Check if Shift is held to lock the date
    setIsDateLocked(e.shiftKey)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      const newPosition = { ...position }

      // Always allow vertical movement
      newPosition.y = Math.max(50, position.y + deltaY)

      // Only allow horizontal movement if date is not locked
      if (!isDateLocked) {
        newPosition.x = position.x + deltaX
      }

      setPosition(newPosition)
      setStartX(e.clientX)
      setStartY(e.clientY)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      const timelineConfig = (window as any).timelineConfig
      if (timelineConfig) {
        let newDate = new Date(event.date)

        // Only update date if it wasn't locked during drag
        if (!isDateLocked && timelineConfig.positionToDate) {
          newDate = timelineConfig.positionToDate(position.x)
        }

        // Update the event with new position and potentially new date
        updateEvent(event.id, {
          ...event,
          x: position.x,
          y: position.y,
          date: newDate.toISOString(),
        })
      }
    }
    setIsDragging(false)
    setIsDateLocked(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    selectElement(event.id)
  }

  const handleToggleDescription = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setShowDescription(!showDescription)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove as any)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove as any)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, position, isDateLocked])

  const isSelected = selectedElementId === event.id

  return (
    <div
      className={`absolute cursor-grab ${isDragging ? "cursor-grabbing" : ""} ${
        isSelected ? "z-30" : "z-20"
      } select-none`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, 0)",
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title="Drag to move (hold Shift to lock date)"
    >
      <div
        className={`flex flex-col min-w-[150px] max-w-[250px] rounded-md shadow-md transition-shadow select-none ${
          isSelected ? "shadow-lg ring-2 ring-blue-400" : ""
        }`}
        style={{
          backgroundColor: event.color,
        }}
      >
        <div className="px-3 py-2 bg-white rounded-t-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-800 pointer-events-none select-none flex-1">{event.title}</h3>
            {event.description && (
              <button
                onClick={handleToggleDescription}
                className="ml-2 p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title={showDescription ? "Hide description" : "Show description"}
              >
                {showDescription ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
              </button>
            )}
          </div>
          {showDescription && event.description && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-600 pointer-events-none select-none leading-relaxed">
                {event.description}
              </p>
            </div>
          )}
        </div>
        <div className="px-3 py-1.5 text-xs text-white pointer-events-none select-none">
          {new Date(event.date).toLocaleDateString()}
        </div>
      </div>
      <div className="absolute w-px h-20 bg-slate-300 left-1/2 bottom-full mb-1 pointer-events-none" />
      <div
        className="absolute w-3 h-3 rounded-full bg-white border-2 left-1/2 bottom-full mb-1 -translate-x-1/2 pointer-events-none"
        style={{
          borderColor: event.color,
        }}
      />
      {/* Visual indicator for drag mode */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap select-none z-40">
          {isDateLocked ? "Date locked - moving vertically" : "Moving freely"}
        </div>
      )}
    </div>
  )
}
