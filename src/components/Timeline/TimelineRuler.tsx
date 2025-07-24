import React, { useMemo } from "react"
import { format, addDays, addHours, addMinutes, addSeconds, addMilliseconds } from "date-fns"
import { REFERENCE_DATE } from "../../utils/timelineCalculations"

// Enum for different zoom levels (kept for compatibility)
export enum ZoomLevel {
  Days = 0,
  Months = 1,
  Years = 2,
}

// Type for scale-based ruler segments
type RulerSegment = {
  date: Date
  label: string
  position: number
  isMainTick: boolean
  tickHeight: 'small' | 'medium' | 'large'
}

interface TimelineRulerProps {
  zoomLevel: ZoomLevel
  firstSegmentPosition: number
  currentTimelineSegments: any[] // Legacy prop, not used in new implementation
  scale: number
  position?: number // Current scroll position from TimelineCanvas
}

// Helper function to determine appropriate time intervals based on scale
const getTimeIntervals = (scale: number) => {
  // Scale represents pixels per day
  const pixelsPerDay = scale
  
  // Define intervals in ascending order of granularity
  const intervals = [
    // Very zoomed out - years
    { threshold: 0.1, major: { unit: 'year', step: 10 }, minor: { unit: 'year', step: 1 } },
    { threshold: 0.5, major: { unit: 'year', step: 5 }, minor: { unit: 'year', step: 1 } },
    { threshold: 1, major: { unit: 'year', step: 1 }, minor: { unit: 'month', step: 6 } },
    
    // Medium zoom - months and weeks
    { threshold: 3, major: { unit: 'month', step: 6 }, minor: { unit: 'month', step: 1 } },
    { threshold: 8, major: { unit: 'month', step: 3 }, minor: { unit: 'month', step: 1 } },
    { threshold: 15, major: { unit: 'month', step: 1 }, minor: { unit: 'week', step: 1 } },
    
    // Zoomed in - days and hours
    { threshold: 30, major: { unit: 'week', step: 1 }, minor: { unit: 'day', step: 1 } },
    { threshold: 60, major: { unit: 'day', step: 7 }, minor: { unit: 'day', step: 1 } },
    { threshold: 120, major: { unit: 'day', step: 1 }, minor: { unit: 'hour', step: 6 } },
    
    // Very zoomed in - hours and minutes
    { threshold: 500, major: { unit: 'hour', step: 12 }, minor: { unit: 'hour', step: 1 } },
    { threshold: 1000, major: { unit: 'hour', step: 6 }, minor: { unit: 'hour', step: 1 } },
    { threshold: 2000, major: { unit: 'hour', step: 1 }, minor: { unit: 'minute', step: 15 } },
    
    // Extremely zoomed in - minutes and seconds
    { threshold: 5000, major: { unit: 'minute', step: 30 }, minor: { unit: 'minute', step: 5 } },
    { threshold: 10000, major: { unit: 'minute', step: 15 }, minor: { unit: 'minute', step: 1 } },
    { threshold: 20000, major: { unit: 'minute', step: 5 }, minor: { unit: 'second', step: 30 } },
    { threshold: 50000, major: { unit: 'minute', step: 1 }, minor: { unit: 'second', step: 10 } },
  ]
  
  // Find the appropriate interval based on scale
  for (let i = intervals.length - 1; i >= 0; i--) {
    if (pixelsPerDay >= intervals[i].threshold) {
      return intervals[i]
    }
  }
  
  // Fallback to the first interval
  return intervals[0]
}

// Helper function to add time based on unit and step
const addTime = (date: Date, unit: string, step: number): Date => {
  switch (unit) {
    case 'year':
      return new Date(date.getFullYear() + step, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
    case 'month':
      return new Date(date.getFullYear(), date.getMonth() + step, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
    case 'week':
      return addDays(date, step * 7)
    case 'day':
      return addDays(date, step)
    case 'hour':
      return addHours(date, step)
    case 'minute':
      return addMinutes(date, step)
    case 'second':
      return addSeconds(date, step)
    case 'millisecond':
      return addMilliseconds(date, step)
    default:
      return addDays(date, step)
  }
}

// Helper function to format labels based on unit
const formatLabel = (date: Date, unit: string, isMainTick: boolean): string => {
  switch (unit) {
    case 'year':
      return format(date, 'yyyy')
    case 'month':
      return isMainTick ? format(date, 'MMM yyyy') : format(date, 'MMM')
    case 'week':
      return format(date, 'MMM d')
    case 'day':
      return isMainTick ? format(date, 'MMM d') : format(date, 'd')
    case 'hour':
      return isMainTick ? format(date, 'MMM d, HH:mm') : format(date, 'HH:mm')
    case 'minute':
      return isMainTick ? format(date, 'HH:mm') : format(date, 'mm')
    case 'second':
      return isMainTick ? format(date, 'HH:mm:ss') : format(date, 'ss')
    default:
      return format(date, 'MMM d')
  }
}

// Helper function to calculate date position
const calculateDatePosition = (date: Date, referenceDate: Date, scale: number): number => {
  const diffTime = date.getTime() - referenceDate.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays * scale
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  firstSegmentPosition,
  scale,
  position = 0,
}) => {
  
  // Calculate visible date range based on position and scale
  const visibleRange = useMemo(() => {
    // Estimate canvas width (this could be passed as prop in the future)
    const canvasWidth = 1200
    const buffer = canvasWidth * 2
    
    // The ruler is inside a container that already has translateX applied
    // So we need to account for the current scroll position
    const viewportLeftEdge = -position
    const viewportRightEdge = viewportLeftEdge + canvasWidth
    
    // Calculate start and end positions with buffer
    const startPos = viewportLeftEdge - buffer
    const endPos = viewportRightEdge + buffer
    
    // Convert positions to dates using the same calculation as the main timeline
    const diffDays = startPos / scale
    const startDate = new Date(REFERENCE_DATE.getTime() + diffDays * 24 * 60 * 60 * 1000)
    
    const endDiffDays = endPos / scale
    const endDate = new Date(REFERENCE_DATE.getTime() + endDiffDays * 24 * 60 * 60 * 1000)
    
    return { startDate, endDate, startPos, endPos }
  }, [position, scale])
  
  // Generate ruler segments based on current scale
  const rulerSegments = useMemo(() => {
    const intervals = getTimeIntervals(scale)
    const segments: RulerSegment[] = []
    
    // Generate major ticks
    let currentDate = new Date(visibleRange.startDate)
    
    // Align to appropriate boundary for major ticks
    switch (intervals.major.unit) {
      case 'year':
        currentDate = new Date(Math.floor(currentDate.getFullYear() / intervals.major.step) * intervals.major.step, 0, 1)
        break
      case 'month':
        currentDate = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / intervals.major.step) * intervals.major.step, 1)
        break
      case 'week':
        const dayOfWeek = currentDate.getDay()
        currentDate = addDays(currentDate, -dayOfWeek)
        break
      case 'day':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        break
      case 'hour':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), Math.floor(currentDate.getHours() / intervals.major.step) * intervals.major.step)
        break
      case 'minute':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), Math.floor(currentDate.getMinutes() / intervals.major.step) * intervals.major.step)
        break
    }
    
    // Generate major ticks
    while (currentDate <= visibleRange.endDate) {
      const tickPosition = calculateDatePosition(currentDate, REFERENCE_DATE, scale)
      segments.push({
        date: new Date(currentDate),
        label: formatLabel(currentDate, intervals.major.unit, true),
        position: tickPosition,
        isMainTick: true,
        tickHeight: 'large'
      })
      currentDate = addTime(currentDate, intervals.major.unit, intervals.major.step)
    }
    
    // Generate minor ticks
    currentDate = new Date(visibleRange.startDate)
    
    // Align to appropriate boundary for minor ticks
    switch (intervals.minor.unit) {
      case 'year':
        currentDate = new Date(Math.floor(currentDate.getFullYear() / intervals.minor.step) * intervals.minor.step, 0, 1)
        break
      case 'month':
        currentDate = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / intervals.minor.step) * intervals.minor.step, 1)
        break
      case 'week':
        const dayOfWeek = currentDate.getDay()
        currentDate = addDays(currentDate, -dayOfWeek)
        break
      case 'day':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
        break
      case 'hour':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), Math.floor(currentDate.getHours() / intervals.minor.step) * intervals.minor.step)
        break
      case 'minute':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), Math.floor(currentDate.getMinutes() / intervals.minor.step) * intervals.minor.step)
        break
    }
    
    while (currentDate <= visibleRange.endDate) {
      const tickPosition = calculateDatePosition(currentDate, REFERENCE_DATE, scale)
      
      // Only add if not already a major tick
      const isAlreadyMajor = segments.some(seg => 
        seg.isMainTick && Math.abs(seg.position - tickPosition) < 1
      )
      
      if (!isAlreadyMajor) {
        segments.push({
          date: new Date(currentDate),
          label: formatLabel(currentDate, intervals.minor.unit, false),
          position: tickPosition,
          isMainTick: false,
          tickHeight: 'medium'
        })
      }
      
      currentDate = addTime(currentDate, intervals.minor.unit, intervals.minor.step)
    }
    
    // Sort segments by position
    return segments.sort((a, b) => a.position - b.position)
  }, [scale, visibleRange])
  
  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      {/* Main ruler line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-300" />
      
      {/* Ruler segments */}
      {rulerSegments.map((segment, index) => {
        const tickHeight = segment.tickHeight === 'large' ? 'h-4' : 
                          segment.tickHeight === 'medium' ? 'h-3' : 'h-2'
        const textSize = segment.isMainTick ? 'text-sm font-medium' : 'text-xs'
        const textColor = segment.isMainTick ? 'text-slate-700' : 'text-slate-500'
        
        return (
          <div
            key={`${segment.date.getTime()}-${index}`}
            className="absolute bottom-0 flex flex-col items-center select-none"
            style={{
              left: `${segment.position}px`,
              transform: 'translateX(-50%)'
            }}
          >
            {/* Tick mark */}
            <div className={`w-px bg-slate-400 ${tickHeight}`} />
            
            {/* Label */}
            <div className={`mt-2 mb-3 px-1 whitespace-nowrap ${textSize} ${textColor} select-none`}>
              {segment.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
