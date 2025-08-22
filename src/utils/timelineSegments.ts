import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  addYears,
  startOfYear,
  endOfYear,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
} from "date-fns"
import { REFERENCE_DATE } from "./timelineCalculations"

// Types for timeline segments
export interface TimelineSegment {
  label: string
  width: number
  date: Date
  position: number
  type: "month" | "year"
  days?: number
  months?: Array<{
    label: string
    width: number
    date: Date
    position: number
  }>
}

// Type for ruler segments
export interface RulerSegment {
  date: Date
  label: string
  position: number
  isMainTick: boolean
  tickHeight: 'small' | 'medium' | 'large'
}

// Helper function to calculate date position
const calculateDatePosition = (date: Date, referenceDate: Date, scale: number): number => {
  const diffTime = date.getTime() - referenceDate.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays * scale
}

// Helper function to determine appropriate time intervals based on scale
const getTimeIntervals = (scale: number) => {
  const pixelsPerDay = scale
  
  const intervals = [
    { threshold: 0.1, major: { unit: 'year', step: 10 }, minor: { unit: 'year', step: 1 } },
    { threshold: 0.5, major: { unit: 'year', step: 5 }, minor: { unit: 'year', step: 1 } },
    { threshold: 1, major: { unit: 'year', step: 1 }, minor: { unit: 'month', step: 6 } },
    { threshold: 3, major: { unit: 'month', step: 6 }, minor: { unit: 'month', step: 1 } },
    { threshold: 8, major: { unit: 'month', step: 3 }, minor: { unit: 'month', step: 1 } },
    { threshold: 15, major: { unit: 'month', step: 1 }, minor: { unit: 'week', step: 1 } },
    { threshold: 30, major: { unit: 'week', step: 1 }, minor: { unit: 'day', step: 1 } },
    { threshold: 60, major: { unit: 'day', step: 7 }, minor: { unit: 'day', step: 1 } },
    { threshold: 120, major: { unit: 'day', step: 1 }, minor: { unit: 'hour', step: 6 } },
    { threshold: 500, major: { unit: 'hour', step: 12 }, minor: { unit: 'hour', step: 1 } },
    { threshold: 1000, major: { unit: 'hour', step: 6 }, minor: { unit: 'hour', step: 1 } },
    { threshold: 2000, major: { unit: 'hour', step: 1 }, minor: { unit: 'minute', step: 15 } },
    { threshold: 5000, major: { unit: 'minute', step: 30 }, minor: { unit: 'minute', step: 5 } },
    { threshold: 10000, major: { unit: 'minute', step: 15 }, minor: { unit: 'minute', step: 1 } },
    { threshold: 20000, major: { unit: 'minute', step: 5 }, minor: { unit: 'second', step: 30 } },
    { threshold: 50000, major: { unit: 'minute', step: 1 }, minor: { unit: 'second', step: 10 } },
  ]
  
  for (let i = intervals.length - 1; i >= 0; i--) {
    if (pixelsPerDay >= intervals[i].threshold) {
      return intervals[i]
    }
  }
  
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

/**
 * Generates timeline segments for the canvas background (original functionality)
 */
export const generateTimelineSegments = (
  currentScale: number,
  startDate: Date,
  endDate: Date
): TimelineSegment[] => {
  console.group(`🔍 generateTimelineSegments Debug`)
  console.log("📊 Input Parameters:", {
    currentScale,
    scaleLevel: currentScale >= 50 ? 'Days' : currentScale >= 5 ? 'Months' : 'Years',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    dateRange: `${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`,
  })

  const segments: TimelineSegment[] = []
  const pixelsPerDay = currentScale

  console.log("📐 Pixels per day:", pixelsPerDay)

  if (currentScale >= 50) {
    // High scale - Generate months with days
    let currentDate = startOfMonth(new Date(startDate.getTime() - 62 * 24 * 60 * 60 * 1000))
    const extendedEndDate = new Date(endDate.getTime() + 62 * 24 * 60 * 60 * 1000)

    let segmentIndex = 0
    while (currentDate <= extendedEndDate) {
      const month = currentDate.getMonth()
      const year = currentDate.getFullYear()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const segmentWidth = daysInMonth * pixelsPerDay
      const position = calculateDatePosition(currentDate, REFERENCE_DATE, currentScale)

      segments.push({
        label: format(currentDate, "MMMM yyyy"),
        width: segmentWidth,
        days: daysInMonth,
        date: new Date(currentDate),
        position,
        type: "month",
      })

      currentDate = addMonths(currentDate, 1)
      segmentIndex++
    }

    console.log(`✅ Days Level - Generated ${segments.length} month segments`)
  } else if (currentScale >= 5) {
    // Medium scale - Generate years with months
    let currentDate = startOfYear(new Date(startDate.getTime() - 2 * 365 * 24 * 60 * 60 * 1000))
    const extendedEndDate = new Date(endDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000)

    let segmentIndex = 0
    while (currentDate <= extendedEndDate) {
      const year = currentDate.getFullYear()
      const position = calculateDatePosition(currentDate, REFERENCE_DATE, currentScale)
      const yearSegment: TimelineSegment = {
        label: format(currentDate, "yyyy"),
        width: 0,
        months: [],
        date: new Date(currentDate),
        position,
        type: "year",
      }

      let yearWidth = 0
      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(year, month, 1)
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)
        const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
        const monthWidth = daysInMonth * pixelsPerDay
        const monthPosition = calculateDatePosition(monthDate, REFERENCE_DATE, currentScale)

        yearSegment.months!.push({
          label: format(monthDate, "MMM"),
          width: monthWidth,
          date: new Date(monthDate),
          position: monthPosition,
        })
        yearWidth += monthWidth
      }
      yearSegment.width = yearWidth

      segments.push(yearSegment)
      currentDate = addYears(currentDate, 1)
      segmentIndex++
    }

    console.log(`✅ Months Level - Generated ${segments.length} year segments`)
  } else {
    // Low scale - Generate years
    let currentDate = startOfYear(new Date(startDate.getTime() - 10 * 365 * 24 * 60 * 60 * 1000))
    const extendedEndDate = new Date(endDate.getTime() + 10 * 365 * 24 * 60 * 60 * 1000)

    let segmentIndex = 0
    while (currentDate <= extendedEndDate) {
      const yearStart = startOfYear(currentDate)
      const yearEnd = endOfYear(currentDate)
      const daysInYear = differenceInDays(yearEnd, yearStart) + 1
      const yearWidth = daysInYear * pixelsPerDay
      const position = calculateDatePosition(currentDate, REFERENCE_DATE, currentScale)

      segments.push({
        label: format(currentDate, "yyyy"),
        width: yearWidth,
        date: new Date(currentDate),
        position,
        type: "year",
      })

      currentDate = addYears(currentDate, 1)
      segmentIndex++
    }

    console.log(`✅ Years Level - Generated ${segments.length} year segments`)
  }

  console.groupEnd()
  return segments
}

/**
 * Generates ruler segments for the timeline ruler component
 */
export const generateRulerSegments = (
  scale: number,
  startDate: Date,
  endDate: Date
): RulerSegment[] => {
  const intervals = getTimeIntervals(scale)
  const segments: RulerSegment[] = []
  
  // Generate major ticks
  let currentDate = new Date(startDate)
  
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
  while (currentDate <= endDate) {
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
  currentDate = new Date(startDate)
  
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
  
  while (currentDate <= endDate) {
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
}
