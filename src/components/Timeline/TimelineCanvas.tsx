"use client"

import type React from "react"
import { useEffect, useState, useRef, Fragment, useCallback, useMemo } from "react"
import { useTimelineStore } from "../../store/timelineStore"
import { TimelineEvent } from "./TimelineEvent"
import { TimelineSpan } from "./TimelineSpan"
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  addYears,
  startOfYear,
  endOfYear,
} from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

// Default reference date for calculations (can be any date)
export const REFERENCE_DATE = new Date(2023, 0, 1) // Jan 1, 2023

// Default center date for initial view
const DEFAULT_CENTER_DATE = new Date(2023, 3, 15) // April 15, 2023

// Enum for different zoom levels
export enum ZoomLevel {
  Days = 0,
  Months = 1,
  Years = 2,
}

export const TimelineCanvas = () => {
  const { events, spans, addEvent, selectElement } = useTimelineStore()
  const [scale, setScale] = useState(5) // Start at year level (5 pixels per day)
  const [position, setPosition] = useState(0) // horizontal scroll position
  const [isDragging, setIsDragging] = useState(false)
  const [startDragX, setStartDragX] = useState(0)
  const [startPosition, setStartPosition] = useState(0)
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(ZoomLevel.Years) // Start at year level
  const [isInitialized, setIsInitialized] = useState(false) // Track if initial positioning is done
  const [offscreenElements, setOffscreenElements] = useState<{
    left: {
      id: string
      color: string
    }[]
    right: {
      id: string
      color: string
    }[]
  }>({
    left: [],
    right: [],
  })

  const canvasRef = useRef<HTMLDivElement>(null)

  // Convert position to date based on reference date
  const positionToDate = useCallback(
    (xPos: number): Date => {
      let dayOffset: number

      if (zoomLevel === ZoomLevel.Days) {
        dayOffset = xPos / scale
      } else if (zoomLevel === ZoomLevel.Months) {
        dayOffset = xPos / (scale / 5)
      } else {
        dayOffset = xPos / (scale / 20)
      }

      // Use more precise date calculation
      const millisecondsOffset = dayOffset * 24 * 60 * 60 * 1000
      return new Date(REFERENCE_DATE.getTime() + millisecondsOffset)
    },
    [scale, zoomLevel],
  )

  // Determine zoom level based on scale
  const getZoomLevelFromScale = useCallback((currentScale: number): ZoomLevel => {
    if (currentScale >= 50) {
      return ZoomLevel.Days
    } else if (currentScale >= 5) {
      return ZoomLevel.Months
    } else {
      return ZoomLevel.Years
    }
  }, [])

  useEffect(() => {
    setZoomLevel(getZoomLevelFromScale(scale))
  }, [scale, getZoomLevelFromScale])

  // Calculate the visible date range based on current position and canvas width
  const getVisibleDateRange = useCallback(() => {
    if (!canvasRef.current) {
      // Fallback - calculate based on current position even without canvas
      const fallbackWidth = 1200 // reasonable default
      const visibleStartX = -position - fallbackWidth
      const visibleEndX = -position + fallbackWidth * 2

      const startDate = positionToDate(visibleStartX)
      const endDate = positionToDate(visibleEndX)

      return { startDate, endDate }
    }

    const canvasWidth = canvasRef.current.clientWidth
    // Calculate the absolute timeline positions that are currently visible
    // Add extra buffer for smooth scrolling and preloading
    const buffer = canvasWidth * 1.5 // 1.5x canvas width buffer on each side
    const visibleStartX = -position - buffer
    const visibleEndX = -position + canvasWidth + buffer

    // Convert positions to dates using our position-to-date conversion
    const startDate = positionToDate(visibleStartX)
    const endDate = positionToDate(visibleEndX)

    return { startDate, endDate }
  }, [position, zoomLevel])

  // Generate timeline segments based on visible range
  const generateTimelineSegments = useCallback(
    (currentScale: number, currentZoomLevel: ZoomLevel, startDate: Date, endDate: Date) => {
      const segments = []

      if (currentZoomLevel === ZoomLevel.Days) {
        // Generate months with days - extend range to ensure coverage
        let currentDate = startOfMonth(new Date(startDate.getTime() - 31 * 24 * 60 * 60 * 1000)) // Start one month earlier
        const extendedEndDate = new Date(endDate.getTime() + 31 * 24 * 60 * 60 * 1000) // End one month later

        while (currentDate <= extendedEndDate) {
          const month = currentDate.getMonth()
          const year = currentDate.getFullYear()
          const daysInMonth = new Date(year, month + 1, 0).getDate()
          segments.push({
            label: format(currentDate, "MMMM yyyy"),
            width: daysInMonth * currentScale,
            days: daysInMonth,
            date: new Date(currentDate),
            type: "month",
          })
          currentDate = addMonths(currentDate, 1)
        }
      } else if (currentZoomLevel === ZoomLevel.Months) {
        // Generate years with months - extend range to ensure coverage
        let currentDate = startOfYear(new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000)) // Start one year earlier
        const extendedEndDate = new Date(endDate.getTime() + 365 * 24 * 60 * 60 * 1000) // End one year later

        while (currentDate <= extendedEndDate) {
          const year = currentDate.getFullYear()
          const yearSegment = {
            label: format(currentDate, "yyyy"),
            width: 0,
            months: [] as any[],
            date: new Date(currentDate),
            type: "year",
          }
          for (let month = 0; month < 12; month++) {
            const monthDate = new Date(year, month, 1)
            const monthStart = startOfMonth(monthDate)
            const monthEnd = endOfMonth(monthDate)
            const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
            const monthWidth = daysInMonth * (currentScale / 5)
            yearSegment.months.push({
              label: format(monthDate, "MMM"),
              width: monthWidth,
              date: new Date(monthDate),
            })
            yearSegment.width += monthWidth
          }
          segments.push(yearSegment)
          currentDate = addYears(currentDate, 1)
        }
      } else {
        // Generate years - extend range to ensure coverage
        let currentDate = startOfYear(new Date(startDate.getTime() - 3 * 365 * 24 * 60 * 60 * 1000)) // Start 3 years earlier
        const extendedEndDate = new Date(endDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000) // End 3 years later

        while (currentDate <= extendedEndDate) {
          const yearStart = startOfYear(currentDate)
          const yearEnd = endOfYear(currentDate)
          const daysInYear = differenceInDays(yearEnd, yearStart) + 1
          const yearWidth = daysInYear * (currentScale / 20)
          segments.push({
            label: format(currentDate, "yyyy"),
            width: yearWidth,
            date: new Date(currentDate),
            type: "year",
          })
          currentDate = addYears(currentDate, 1)
        }
      }
      return segments
    },
    [],
  )

  // Calculate date position based on reference date
  const calculateDatePosition = useCallback(
    (date: Date): number => {
      const diffTime = date.getTime() - REFERENCE_DATE.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24) // More precise - don't round here

      if (zoomLevel === ZoomLevel.Days) {
        return diffDays * scale
      } else if (zoomLevel === ZoomLevel.Months) {
        return diffDays * (scale / 5)
      } else {
        return diffDays * (scale / 20)
      }
    },
    [scale, zoomLevel],
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
    }
  }, [calculateDatePosition, isInitialized])

  // Get current timeline segments based on visible range
  const { startDate, endDate } = getVisibleDateRange()
  const currentTimelineSegments = useMemo(
    () => generateTimelineSegments(scale, zoomLevel, startDate, endDate),
    [scale, zoomLevel, startDate, endDate, generateTimelineSegments],
  )

  // Calculate the position of the first segment for rendering
  const firstSegmentPosition = useMemo(() => {
    if (currentTimelineSegments.length === 0) return 0
    const firstSegmentDate = currentTimelineSegments[0].date
    return calculateDatePosition(firstSegmentDate)
  }, [currentTimelineSegments, calculateDatePosition])

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
      const newZoomLevel = getZoomLevelFromScale(newScale)
      const diffTime = dateUnderCenter.getTime() - REFERENCE_DATE.getTime()
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

      let absoluteXForCenteredDateAtNewScale: number
      if (newZoomLevel === ZoomLevel.Days) {
        absoluteXForCenteredDateAtNewScale = diffDays * newScale
      } else if (newZoomLevel === ZoomLevel.Months) {
        absoluteXForCenteredDateAtNewScale = diffDays * (newScale / 5)
      } else {
        absoluteXForCenteredDateAtNewScale = diffDays * (newScale / 20)
      }

      // 6. Calculate the new scroll position to keep `dateUnderCenter` at `centerX`
      const newPosition = centerX - absoluteXForCenteredDateAtNewScale

      // 7. Apply the new position
      setPosition(newPosition)
    }
  }

  const setPresetZoom = useCallback(
    (level: ZoomLevel) => {
      if (canvasRef.current) {
        const currentCanvasWidth = canvasRef.current.clientWidth
        const centerX = currentCanvasWidth / 2

        // Get the date currently at the center
        const dateUnderCenter = positionToDate(-position + centerX)

        let newScale: number

        switch (level) {
          case ZoomLevel.Days:
            newScale = 100
            break
          case ZoomLevel.Months:
            newScale = 20
            break
          case ZoomLevel.Years:
            newScale = 5
            break
          default:
            newScale = scale
        }

        // Calculate the absolute X position of `dateUnderCenter` with the new scale
        const diffTime = dateUnderCenter.getTime() - REFERENCE_DATE.getTime()
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

        let absoluteXForCenteredDateAtNewScale: number
        if (level === ZoomLevel.Days) {
          absoluteXForCenteredDateAtNewScale = diffDays * newScale
        } else if (level === ZoomLevel.Months) {
          absoluteXForCenteredDateAtNewScale = diffDays * (newScale / 5)
        } else {
          absoluteXForCenteredDateAtNewScale = diffDays * (newScale / 20)
        }

        // Calculate the new scroll position to keep `dateUnderCenter` at `centerX`
        const newPosition = centerX - absoluteXForCenteredDateAtNewScale

        // Apply the new state
        setScale(newScale)
        setPosition(newPosition)
      }
    },
    [position, scale, zoomLevel],
  )

  // Center on a specific element by ID
  const centerOnElement = useCallback(
    (elementId: string) => {
      // Find the element in events or spans
      const event = events.find((e) => e.id === elementId)
      const span = spans.find((s) => s.id === elementId)
      if (canvasRef.current) {
        const canvasWidth = canvasRef.current.clientWidth
        if (event) {
          // For events, center on the x position
          const eventX = calculateDatePosition(new Date(event.date))
          const newPosition = -(eventX - canvasWidth / 2)
          setPosition(newPosition)
          // Also select the element
          selectElement(elementId)
        } else if (span) {
          // For spans, center on the middle of the span
          const spanStartX = calculateDatePosition(new Date(span.startDate))
          const spanEndX = calculateDatePosition(new Date(span.endDate))
          const spanCenterX = spanStartX + (spanEndX - spanStartX) / 2
          const newPosition = -(spanCenterX - canvasWidth / 2)
          setPosition(newPosition)
          // Also select the element
          selectElement(elementId)
        }
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

  // Check for off-screen elements
  useEffect(() => {
    if (!canvasRef.current) return
    const canvasRect = canvasRef.current.getBoundingClientRect()
    const visibleLeftEdge = -position
    const visibleRightEdge = -position + canvasRect.width
    const leftOffscreen: {
      id: string
      color: string
    }[] = []
    const rightOffscreen: {
      id: string
      color: string
    }[] = []
    // Check events
    events.forEach((event) => {
      const eventX = calculateDatePosition(new Date(event.date))
      if (eventX < visibleLeftEdge) {
        leftOffscreen.push({
          id: event.id,
          color: event.color,
        })
      } else if (eventX > visibleRightEdge) {
        rightOffscreen.push({
          id: event.id,
          color: event.color,
        })
      }
    })
    // Check spans
    spans.forEach((span) => {
      const spanStartX = calculateDatePosition(new Date(span.startDate))
      const spanEndX = calculateDatePosition(new Date(span.endDate))
      // If the span is completely off-screen to the left
      if (spanEndX < visibleLeftEdge) {
        leftOffscreen.push({
          id: span.id,
          color: span.color,
        })
      }
      // If the span is completely off-screen to the right
      else if (spanStartX > visibleRightEdge) {
        rightOffscreen.push({
          id: span.id,
          color: span.color,
        })
      }
    })
    setOffscreenElements({
      left: leftOffscreen,
      right: rightOffscreen,
    })
  }, [events, spans, position, scale, zoomLevel, calculateDatePosition])

  // Render the appropriate timeline ruler based on zoom level
  const renderTimelineRuler = () => {
    if (zoomLevel === ZoomLevel.Days) {
      return (
        <div
          className="flex h-full select-none"
          style={{
            transform: `translateX(${firstSegmentPosition}px)`,
          }}
        >
          {currentTimelineSegments.map((month, index) => (
            <div
              key={`${month.date.getTime()}-${index}`}
              className="flex flex-col border-r border-slate-200 select-none"
              style={{
                width: `${month.width}px`,
              }}
              data-timeline-segment
              data-date={month.date.toISOString()}
            >
              <div className="h-8 px-2 flex items-center text-sm font-medium text-slate-600 border-b border-slate-200 select-none">
                {month.label}
              </div>
              <div className="flex h-8 select-none">
                {Array.from({
                  length: month.days,
                }).map((_, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="border-r border-slate-200 flex items-center justify-center text-xs text-slate-500 select-none"
                    style={{
                      width: `${scale}px`,
                    }}
                  >
                    {dayIndex + 1}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    } else if (zoomLevel === ZoomLevel.Months) {
      return (
        <div
          className="flex h-full select-none"
          style={{
            transform: `translateX(${firstSegmentPosition}px)`,
          }}
        >
          {currentTimelineSegments.map((year, yearIndex) => (
            <div
              key={`${year.date.getTime()}-${yearIndex}`}
              className="flex flex-col border-r border-slate-200 select-none"
              style={{
                width: `${year.width}px`,
              }}
              data-timeline-segment
              data-date={year.date.toISOString()}
            >
              <div className="h-8 px-2 flex items-center text-sm font-medium text-slate-600 border-b border-slate-200 select-none">
                {year.label}
              </div>
              <div className="flex h-8 select-none">
                {year.months.map((month, monthIndex) => (
                  <div
                    key={monthIndex}
                    className="border-r border-slate-200 flex items-center justify-center text-xs text-slate-500 select-none"
                    style={{
                      width: `${month.width}px`,
                    }}
                    data-month-segment
                    data-date={month.date.toISOString()}
                  >
                    {month.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    } else {
      return (
        <div
          className="flex h-full select-none"
          style={{
            transform: `translateX(${firstSegmentPosition}px)`,
          }}
        >
          {currentTimelineSegments.map((year, yearIndex) => (
            <div
              key={`${year.date.getTime()}-${yearIndex}`}
              className="flex flex-col border-r border-slate-200 select-none"
              style={{
                width: `${year.width}px`,
              }}
              data-timeline-segment
              data-date={year.date.toISOString()}
            >
              <div className="h-16 px-2 flex items-center justify-center text-sm font-medium text-slate-600 select-none">
                {year.label}
              </div>
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-white select-none">
      <div className="absolute top-4 right-4 flex space-x-2 z-10">
        <button
          onClick={() => handleZoom(0.8)}
          className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 hover:shadow-lg transition-all duration-200 active:scale-95 select-none"
          title="Zoom Out"
        >
          <span className="text-lg font-bold text-slate-600 select-none">-</span>
        </button>
        <button
          onClick={() => handleZoom(1.25)}
          className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 hover:shadow-lg transition-all duration-200 active:scale-95 select-none"
          title="Zoom In"
        >
          <span className="text-lg font-bold text-slate-600 select-none">+</span>
        </button>
      </div>
      <div
        className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10"
        onClick={() => setPosition(position + 500)} // Scroll left
      >
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 select-none">
          <ChevronLeftIcon size={20} />
        </button>
      </div>
      <div
        className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10"
        onClick={() => setPosition(position - 500)} // Scroll right
      >
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50 select-none">
          <ChevronRightIcon size={20} />
        </button>
      </div>
      {/* Off-screen indicators */}
      <div className="absolute inset-y-0 left-0 flex flex-col items-start justify-center pointer-events-none z-20">
        {offscreenElements.left.map((elem, index) => (
          <div
            key={`left-${elem.id}`}
            className="ml-1 my-1 w-3 h-3 rounded-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity pointer-events-auto select-none"
            style={{
              backgroundColor: elem.color,
            }}
            onClick={() => centerOnElement(elem.id)}
            title="Click to center this element"
          />
        ))}
      </div>
      <div className="absolute inset-y-0 right-0 flex flex-col items-end justify-center pointer-events-none z-20">
        {offscreenElements.right.map((elem, index) => (
          <div
            key={`right-${elem.id}`}
            className="mr-1 my-1 w-3 h-3 rounded-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity pointer-events-auto select-none"
            style={{
              backgroundColor: elem.color,
            }}
            onClick={() => centerOnElement(elem.id)}
            title="Click to center this element"
          />
        ))}
      </div>
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
          <div className="sticky top-0 z-10 h-16 bg-white border-b border-slate-200 select-none overflow-hidden">
            {renderTimelineRuler()}
          </div>
          {/* Timeline ruler indicators */}
          <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-20">
            {/* Event indicators */}
            {events.map((event) => {
              const eventX = calculateDatePosition(new Date(event.date))
              const isVisible =
                eventX >= -position - 100 && eventX <= -position + (canvasRef.current?.clientWidth || 1200) + 100

              if (!isVisible) return null

              return (
                <div
                  key={`ruler-event-${event.id}`}
                  className="absolute top-0 bottom-0 flex items-end justify-center pb-1"
                  style={{
                    left: `${eventX}px`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full border border-white shadow-sm"
                    style={{
                      backgroundColor: event.color,
                    }}
                    title={event.title}
                  />
                </div>
              )
            })}

            {/* Span indicators */}
            {spans.map((span) => {
              const startX = calculateDatePosition(new Date(span.startDate))
              const endX = calculateDatePosition(new Date(span.endDate))
              const spanWidth = endX - startX
              const isVisible =
                endX >= -position - 100 && startX <= -position + (canvasRef.current?.clientWidth || 1200) + 100

              if (!isVisible) return null

              return (
                <div
                  key={`ruler-span-${span.id}`}
                  className="absolute bottom-1 h-1 rounded-full shadow-sm"
                  style={{
                    left: `${startX}px`,
                    width: `${spanWidth}px`,
                    backgroundColor: span.color,
                    opacity: 0.7,
                  }}
                  title={span.title}
                >
                  {/* Start marker */}
                  <div
                    className="absolute w-2 h-2 rounded-full border border-white shadow-sm -top-0.5 -left-1"
                    style={{
                      backgroundColor: span.color,
                    }}
                  />
                  {/* End marker */}
                  <div
                    className="absolute w-2 h-2 rounded-full border border-white shadow-sm -top-0.5 -right-1"
                    style={{
                      backgroundColor: span.color,
                    }}
                  />
                </div>
              )
            })}
          </div>
          {/* Timeline content */}
          <div className="relative h-[calc(100%-4rem)] pt-8 select-none">
            {/* Guidelines - dynamically generated based on visible segments */}
            {zoomLevel === ZoomLevel.Days &&
              currentTimelineSegments.map((segment, index) => (
                <div
                  key={`guideline-${segment.date.getTime()}-${index}`}
                  className="absolute top-0 bottom-0 border-r border-slate-100 select-none z-1"
                  style={{
                    left: `${firstSegmentPosition + (index > 0 ? currentTimelineSegments.slice(0, index).reduce((acc, s) => acc + s.width, 0) : 0)}px`,
                  }}
                />
              ))}
            {zoomLevel === ZoomLevel.Months &&
              currentTimelineSegments.map((yearSegment, yearIndex) => (
                <Fragment key={`year-guidelines-${yearSegment.date.getTime()}-${yearIndex}`}>
                  <div
                    className="absolute top-0 bottom-0 border-r border-slate-200 select-none z-1"
                    style={{
                      left: `${firstSegmentPosition + (yearIndex > 0 ? currentTimelineSegments.slice(0, yearIndex).reduce((acc, s) => acc + s.width, 0) : 0)}px`,
                    }}
                  />
                  {yearSegment.months.map((month, monthIndex) => {
                    const prevMonthsWidth = yearSegment.months.slice(0, monthIndex).reduce((acc, m) => acc + m.width, 0)
                    const prevYearsWidth = currentTimelineSegments
                      .slice(0, yearIndex)
                      .reduce((acc, s) => acc + s.width, 0)
                    return (
                      <div
                        key={`month-guideline-${month.date.getTime()}-${monthIndex}`}
                        className="absolute top-0 bottom-0 border-r border-slate-100 select-none z-1"
                        style={{
                          left: `${firstSegmentPosition + prevYearsWidth + prevMonthsWidth}px`,
                        }}
                      />
                    )
                  })}
                </Fragment>
              ))}
            {zoomLevel === ZoomLevel.Years &&
              currentTimelineSegments.map((segment, index) => (
                <div
                  key={`year-guideline-${segment.date.getTime()}-${index}`}
                  className="absolute top-0 bottom-0 border-r border-slate-100 select-none z-1"
                  style={{
                    left: `${firstSegmentPosition + (index > 0 ? currentTimelineSegments.slice(0, index).reduce((acc, s) => acc + s.width, 0) : 0)}px`,
                  }}
                />
              ))}

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
