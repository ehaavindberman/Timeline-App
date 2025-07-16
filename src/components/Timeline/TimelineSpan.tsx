"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useTimelineStore } from "../../store/timelineStore"
import type { ZoomLevel } from "./TimelineCanvas"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

type TimelineSpanProps = {
  span: {
    id: string
    title: string
    description: string
    startDate: string
    endDate: string
    x: number
    y: number
    width: number
    color: string
  }
  calculateDatePosition: (date: Date) => number
  zoomLevel: ZoomLevel
}

export const TimelineSpan = ({ span, calculateDatePosition, zoomLevel }: TimelineSpanProps) => {
  const { updateSpan, selectElement, selectedElementId } = useTimelineStore()
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isDateLocked, setIsDateLocked] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<"left" | "right" | null>(null)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [startWidth, setStartWidth] = useState(span.width)
  const [startPosition, setStartPosition] = useState(span.x)
  const [position, setPosition] = useState({
    x: span.x,
    y: span.y,
  })
  const [width, setWidth] = useState(span.width)

  // Update position and width based on dates when zoom level changes
  useEffect(() => {
    const startDate = new Date(span.startDate)
    const endDate = new Date(span.endDate)
    const xPos = calculateDatePosition(startDate)
    const endPos = calculateDatePosition(endDate)
    const newWidth = endPos - xPos

    setPosition((prev) => ({
      x: xPos,
      y: prev.y, // Keep the y position unchanged
    }))
    setWidth(newWidth > 0 ? newWidth : 100)
  }, [span.startDate, span.endDate, zoomLevel, calculateDatePosition])

  // Update y position when span.y changes
  useEffect(() => {
    setPosition((prev) => ({
      ...prev,
      y: span.y,
    }))
  }, [span.y])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault() // Prevent text selection
    setIsDragging(true)
    setStartX(e.clientX)
    setStartY(e.clientY)
    selectElement(span.id)

    // Check if Shift is held to lock the date
    setIsDateLocked(e.shiftKey)
  }

  const handleResizeStart = (e: React.MouseEvent, direction: "left" | "right") => {
    e.stopPropagation()
    e.preventDefault() // Prevent text selection
    setIsResizing(true)
    setResizeDirection(direction)
    setStartX(e.clientX)
    setStartWidth(width)
    setStartPosition(position.x)
    selectElement(span.id)
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
    if (isResizing) {
      const deltaX = e.clientX - startX
      if (resizeDirection === "right") {
        const newWidth = Math.max(100, startWidth + deltaX)
        setWidth(newWidth)
      } else if (resizeDirection === "left") {
        const newWidth = Math.max(100, startWidth - deltaX)
        const newX = startPosition + startWidth - newWidth
        setWidth(newWidth)
        setPosition((prev) => ({
          ...prev,
          x: newX,
        }))
      }
    }
  }

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      const timelineConfig = (window as any).timelineConfig
      if (timelineConfig) {
        let newStartDate = new Date(span.startDate)
        let newEndDate = new Date(span.endDate)

        if (isDragging && !isDateLocked) {
          // When dragging horizontally (and date not locked), preserve the duration
          const duration = new Date(span.endDate).getTime() - new Date(span.startDate).getTime()
          if (timelineConfig.positionToDate) {
            newStartDate = timelineConfig.positionToDate(position.x)
            newEndDate = new Date(newStartDate.getTime() + duration)
          }
        } else if (isResizing) {
          // When resizing, update the appropriate date
          if (resizeDirection === "right") {
            if (timelineConfig.positionToDate) {
              newEndDate = timelineConfig.positionToDate(position.x + width)
            }
          } else if (resizeDirection === "left") {
            if (timelineConfig.positionToDate) {
              newStartDate = timelineConfig.positionToDate(position.x)
            }
          }
        }

        updateSpan(span.id, {
          ...span,
          x: position.x,
          y: position.y,
          width: width,
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
        })
      }
    }
    setIsDragging(false)
    setIsResizing(false)
    setResizeDirection(null)
    setIsDateLocked(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    selectElement(span.id)
  }

  const handleToggleDescription = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setShowDescription(!showDescription)
  }

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove as any)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove as any)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, isResizing, position, width, isDateLocked])

  const isSelected = selectedElementId === span.id

  return (
    <div
      className={`absolute ${
        isDragging ? "cursor-grabbing" : isResizing ? "cursor-ew-resize" : "cursor-grab hover:cursor-grab"
      } ${isSelected ? "z-30" : "z-20"} select-none`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title="Drag to move (hold Shift to lock date)"
    >
      <div
        className={`rounded-md transition-shadow select-none ${isSelected ? "shadow-lg ring-2 ring-blue-400" : "shadow-md"}`}
        style={{
          backgroundColor: span.color,
          opacity: 0.9,
        }}
      >
        <div className="px-3 py-2 bg-white rounded-t-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-800 pointer-events-none select-none flex-1">{span.title}</h3>
            {span.description && (
              <button
                onClick={handleToggleDescription}
                className="ml-2 p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                title={showDescription ? "Hide description" : "Show description"}
              >
                {showDescription ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
              </button>
            )}
          </div>
          {showDescription && span.description && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-600 pointer-events-none select-none leading-relaxed">
                {span.description}
              </p>
            </div>
          )}
        </div>
        <div className="px-3 py-2 text-xs text-white flex justify-between pointer-events-none select-none">
          <span>{new Date(span.startDate).toLocaleDateString()}</span>
          <span>to</span>
          <span>{new Date(span.endDate).toLocaleDateString()}</span>
        </div>
      </div>
      {/* Resize handles */}
      <div
        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize z-10"
        onMouseDown={(e) => handleResizeStart(e, "left")}
      />
      <div
        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize z-10"
        onMouseDown={(e) => handleResizeStart(e, "right")}
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
