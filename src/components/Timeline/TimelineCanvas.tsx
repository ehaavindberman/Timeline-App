"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useTimelineStore } from "../../store/timelineStore"
import { TimelineEvent } from "./TimelineEvent"
import { TimelineSpan } from "./TimelineSpan"

import { TimelineControls } from "./TimelineControls"
import { OffscreenIndicators } from "./OffscreenIndicators"
import { centerOnElement as centerOnElementUtil } from "../../utils/timelineUtils"
import { TimelineRuler } from "./TimelineRuler"
import { TimelineRulerIndicators } from "./TimelineRulerIndicators"
import { TimelineGuidelines } from "./TimelineGuidelines"
import { useOffscreenElements } from "../../hooks/useOffscreenElements"
import { generateTimelineSegments, ZoomLevel } from "../../utils/timelineSegments"
import {
  positionToDate as positionToDateUtil,
  calculateDatePosition as calculateDatePositionUtil,
  getZoomLevelFromScale as getZoomLevelFromScaleUtil,
  REFERENCE_DATE,
} from "../../utils/timelineCalculations"



// Default center date for initial view
const DEFAULT_CENTER_DATE = new Date(2023, 4, 12) // April 12, 2023



export const TimelineCanvas = () => {
  const { events, spans, addEvent, selectElement } = useTimelineStore()
  const [scale, setScale] = useState(5) // Start at year level (5 pixels per day)
  const [position, setPosition] = useState(0) // horizontal scroll position
  const [isDragging, setIsDragging] = useState(false)
  const [startDragX, setStartDragX] = useState(0)
  const [startPosition, setStartPosition] = useState(0)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(ZoomLevel.Years) // Start at year level
  const [isInitialized, setIsInitialized] = useState(false) // Track if initial positioning is done

  const canvasRef = useRef<HTMLDivElement>(null)

  // Convert position to date based on reference date
  const positionToDate = useCallback(
    (xPos: number): Date => {
      return positionToDateUtil(xPos, scale)
    },
    [scale],
  )

  // Determine zoom level based on scale
  const getZoomLevelFromScale = useCallback((currentScale: number): ZoomLevel => {
    return getZoomLevelFromScaleUtil(currentScale)
  }, [])

  useEffect(() => {
    setZoomLevel(getZoomLevelFromScale(scale))
  }, [scale, getZoomLevelFromScale])

  // Calculate the visible date range based on current position and canvas width
  const getVisibleDateRange = useCallback(() => {
    const fallbackWidth = 1200
    const canvasWidth = canvasRef.current?.clientWidth || fallbackWidth
    const buffer = Math.max(canvasWidth * 2, 2400)

    // FIXED: Calculate the absolute timeline positions correctly
    // position is the CSS transform offset, so we need to convert to absolute timeline coordinates
    const viewportLeftEdge = -position // Left edge of visible area in timeline coordinates
    const viewportRightEdge = -position + canvasWidth // Right edge of visible area

    // Add buffer to get the range we need to generate segments for
    const visibleStartX = viewportLeftEdge - buffer
    const visibleEndX = viewportRightEdge + buffer

    console.log("📍 FIXED getVisibleDateRange Debug:", {
      position: Math.round(position),
      canvasWidth,
      buffer,
      viewportLeftEdge: Math.round(viewportLeftEdge),
      viewportRightEdge: Math.round(viewportRightEdge),
      visibleStartX: Math.round(visibleStartX),
      visibleEndX: Math.round(visibleEndX),
      viewportCenter: Math.round(viewportLeftEdge + canvasWidth / 2),
    })

    const startDate = positionToDate(visibleStartX)
    const endDate = positionToDate(visibleEndX)

    // Verify the center calculation
    const centerX = viewportLeftEdge + canvasWidth / 2
    const centerDate = positionToDate(centerX)

    console.log("📅 Date Range Verification:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      centerX: Math.round(centerX),
      centerDate: centerDate.toISOString(),
      expectedCenter: "Should be around April 2023 initially",
    })

    return { startDate, endDate, canvasWidth, buffer }
  }, [position, positionToDate, scale, zoomLevel])

  // Generate timeline segments based on visible range


  // Calculate date position based on reference date
  const calculateDatePosition = useCallback(
    (date: Date): number => {
      return calculateDatePositionUtil(date, scale)
    },
    [scale],
  )

  // Initialize the timeline position to center on DEFAULT_CENTER_DATE
  useEffect(() => {
    if (canvasRef.current && !isInitialized) {
      const canvasWidth = canvasRef.current.clientWidth
      const centerX = canvasWidth / 2

      // Calculate position of DEFAULT_CENTER_DATE
      const centerDatePosition = calculateDatePosition(DEFAULT_CENTER_DATE)

      // Set position to center the default date
      const initialPosition = centerX - centerDatePosition
      setPosition(initialPosition)
      setIsInitialized(true)

      console.log("🎯 Initial Positioning:", {
        canvasWidth,
        centerX,
        defaultCenterDate: DEFAULT_CENTER_DATE.toISOString(),
        centerDatePosition: Math.round(centerDatePosition),
        initialPosition: Math.round(initialPosition),
        verification: "Center should be at DEFAULT_CENTER_DATE",
      })
    }
  }, [calculateDatePosition, isInitialized])

  // Get current timeline segments based on visible range
  const { startDate, endDate } = getVisibleDateRange()
  const currentTimelineSegments = useMemo(
    () => generateTimelineSegments(scale, zoomLevel, startDate, endDate),
    [scale, zoomLevel, startDate, endDate],
  )

  // Calculate the position of the first segment for rendering
  const firstSegmentPosition = useMemo(() => {
    if (currentTimelineSegments.length === 0) return 0
    const firstSegmentDate = currentTimelineSegments[0].date
    const segmentPosition = calculateDatePosition(firstSegmentDate)

    console.log("🎯 First Segment Positioning:", {
      firstSegmentDate: firstSegmentDate.toISOString(),
      firstSegmentPosition: Math.round(segmentPosition),
      currentPosition: Math.round(position),
      viewportCenter: Math.round(-position + (canvasRef.current?.clientWidth || 1200) / 2),
      centerDate: positionToDate(-position + (canvasRef.current?.clientWidth || 1200) / 2).toISOString(),
    })

    return segmentPosition
  }, [currentTimelineSegments, calculateDatePosition, position, positionToDate])

  // Snap x position to nearest day/month/year depending on zoom level
  const snapToGrid = useCallback(
    (xPos: number): number => {
      if (zoomLevel === ZoomLevel.Days) {
        return Math.round(xPos / scale) * scale
      } else if (zoomLevel === ZoomLevel.Months) {
        const monthScale = scale / 5
        return Math.round(xPos / monthScale) * monthScale
      } else {
        const yearScale = scale / 20
        return Math.round(xPos / yearScale) * yearScale
      }
    },
    [scale, zoomLevel],
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent text selection
    setIsDragging(true)
    setStartDragX(e.clientX)
    setStartPosition(position)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - startDragX
      const newPosition = startPosition + deltaX
      setPosition(newPosition) // No bounds checking for infinite scroll
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Get current viewport center
  const getCurrentViewportCenter = useCallback(() => {
    if (canvasRef.current) {
      const canvasWidth = canvasRef.current.clientWidth
      const centerX = canvasWidth / 2

      // Calculate the absolute timeline position at the center of the viewport
      const absoluteXAtCenter = -position + centerX

      // Convert to date
      const centerDate = positionToDate(absoluteXAtCenter)

      return {
        date: centerDate,
        x: absoluteXAtCenter,
      }
    }

    // Fallback
    return {
      date: new Date(),
      x: 0,
    }
  }, [position, positionToDate])

  // Handle double click to add event
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const rawX = e.clientX - rect.left - position
      const x = snapToGrid(rawX) // Snap to grid
      const date = positionToDate(x)
      addEvent({
        id: `event-${Date.now()}`,
        title: `🌿 New Nature Event`,
        description: "A significant moment in the natural world.",
        date: date.toISOString(),
        x: x,
        y: 100, // Default y position
        color: "#10b981",
      })
    }
  }

  const handleZoom = (factor: number) => {
    if (canvasRef.current) {
      const currentCanvasWidth = canvasRef.current.clientWidth
      const centerX = currentCanvasWidth / 2

      // 1. Calculate the absolute pixel position under the current canvas center
      const absoluteXAtCurrentCenter = -position + centerX

      // 2. Convert this absolute pixel position to a date BEFORE zooming
      const dateUnderCenter = positionToDate(absoluteXAtCurrentCenter)

      // 3. Determine the new scale
      const targetScale = scale * factor
      const newScale = Math.max(1, Math.min(1000, targetScale)) // Increased max scale for infinite scroll

      // 4. Update scale
      setScale(newScale)

      // 5. Calculate the absolute X position of `dateUnderCenter` with the new scale
      const diffTime = dateUnderCenter.getTime() - REFERENCE_DATE.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)

      // Simplified: scale is always pixels per day
      const absoluteXForCenteredDateAtNewScale = diffDays * newScale

      // 6. Calculate the new scroll position to keep `dateUnderCenter` at `centerX`
      const newPosition = centerX - absoluteXForCenteredDateAtNewScale

      // 7. Apply the new position
      setPosition(newPosition)
    }
  }

  // Zoom preset methods
  const setPresetZoom = useCallback((level: 'day' | 'month' | 'year') => {
    if (canvasRef.current) {
      const currentCanvasWidth = canvasRef.current.clientWidth
      const centerX = currentCanvasWidth / 2
      
      // Get the date currently at the center
      const absoluteXAtCurrentCenter = -position + centerX
      const dateUnderCenter = positionToDate(absoluteXAtCurrentCenter)
      
      // Set the appropriate scale for each zoom level
      let newScale: number
      let newZoomLevel: ZoomLevel
      
      switch (level) {
        case 'day':
          newScale = 100 // High scale for day view
          newZoomLevel = ZoomLevel.Days
          break
        case 'month':
          newScale = 20 // Medium scale for month view  
          newZoomLevel = ZoomLevel.Months
          break
        case 'year':
          newScale = 5 // Low scale for year view
          newZoomLevel = ZoomLevel.Years
          break
        default:
          return
      }
      
      // Update scale and zoom level
      setScale(newScale)
      setZoomLevel(newZoomLevel)
      
      // Calculate new position to keep the same date centered
      const diffTime = dateUnderCenter.getTime() - REFERENCE_DATE.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      
      // Simplified: scale is always pixels per day
      const absoluteXForCenteredDateAtNewScale = diffDays * newScale
      
      const newPosition = centerX - absoluteXForCenteredDateAtNewScale
      setPosition(newPosition)
    }
  }, [position, positionToDate])

  // Expose timeline methods globally for toolbar access
  useEffect(() => {
    ;(window as any).timelineConfig = {
      setPresetZoom,
      getCurrentViewportCenter,
      calculateDatePosition,
    }
    
    return () => {
      delete (window as any).timelineConfig
    }
  }, [setPresetZoom, getCurrentViewportCenter, calculateDatePosition])

  // Center on a specific element by ID
  const centerOnElement = useCallback(
    (elementId: string) => {
      if (canvasRef.current) {
        const canvasWidth = canvasRef.current.clientWidth
        centerOnElementUtil(
          elementId,
          events,
          spans,
          calculateDatePosition,
          setPosition,
          selectElement,
          canvasWidth
        )
      }
    },
    [events, spans, calculateDatePosition, selectElement],
  )

  // Add to global window so other components can access it
  useEffect(() => {
    ;(window as any).timelineConfig = {
      scale,
      referenceDate: REFERENCE_DATE,
      zoomLevel,
      positionToDate: positionToDate,
      calculateDatePosition: calculateDatePosition,
      centerOnElement,
      setPresetZoom,
      getCurrentViewportCenter,
    }
  }, [
    scale,
    zoomLevel,
    positionToDate,
    calculateDatePosition,
    centerOnElement,
    setPresetZoom,
    getCurrentViewportCenter,
  ])

  // Calculate off-screen elements using custom hook
  const offscreenElements = useOffscreenElements({
    events,
    spans,
    position,
    canvasRef,
    calculateDatePosition,
    scale,
    zoomLevel,
  })

  // Render the appropriate timeline ruler based on zoom level


  return (
    <div className="relative flex-1 overflow-hidden bg-white select-none">
      <TimelineControls
        onZoomIn={() => handleZoom(1.25)}
        onZoomOut={() => handleZoom(0.8)}
        onScrollLeft={() => setPosition(position + 500)}
        onScrollRight={() => setPosition(position - 500)}
      />
      <OffscreenIndicators offscreenElements={offscreenElements} onCenterElement={centerOnElement} />
      <div
        id="timeline-canvas"
        ref={canvasRef}
        className="h-full w-full overflow-hidden cursor-grab select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div
          className="relative h-full select-none"
          style={{
            width: "100%",
            transform: `translateX(${position}px)`,
            transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Timeline ruler */}
          <div className="sticky top-0 z-10 h-16 bg-white border-b border-slate-200 select-none">
            <TimelineRuler
              zoomLevel={zoomLevel}
              firstSegmentPosition={firstSegmentPosition}
              currentTimelineSegments={currentTimelineSegments}
              scale={scale}
              position={position}
            />
          </div>
          {/* Timeline ruler indicators */}
          <TimelineRulerIndicators
            events={events}
            spans={spans}
            calculateDatePosition={calculateDatePosition}
            position={position}
            canvasWidth={canvasRef.current?.clientWidth || 1200}
          />
          {/* Timeline content */}
          <div className="relative h-[calc(100%-4rem)] pt-8 select-none">
            {/* Guidelines - dynamically generated based on visible segments */}
            <TimelineGuidelines
              zoomLevel={zoomLevel}
              currentTimelineSegments={currentTimelineSegments}
              firstSegmentPosition={firstSegmentPosition}
            />

            {/* Time spans (z-index 20, selected: 30) */}
            {spans.map((span) => (
              <TimelineSpan
                key={span.id}
                span={span}
                calculateDatePosition={calculateDatePosition}
                zoomLevel={zoomLevel}
              />
            ))}
            {/* Events (z-index 20, selected: 30) */}
            {events.map((event) => (
              <TimelineEvent
                key={event.id}
                event={event}
                calculateDatePosition={calculateDatePosition}
                zoomLevel={zoomLevel}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
