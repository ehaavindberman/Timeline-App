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

// Types for timeline segments
export interface TimelineSegment {
  label: string
  width: number
  date: Date
  type: "month" | "year"
  days?: number
  months?: Array<{
    label: string
    width: number
    date: Date
  }>
}

/**
 * Generates timeline segments based on scale and date range
 * This function handles the complex logic for creating timeline segments
 * for different scale levels (high scale = days view, medium = months, low = years)
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

  // Scale is always pixels per day
  const pixelsPerDay = currentScale

  console.log("📐 Pixels per day:", pixelsPerDay)

  if (currentScale >= 50) {
    // High scale - Generate months with days - extend range with buffer to ensure full coverage
    let currentDate = startOfMonth(new Date(startDate.getTime() - 62 * 24 * 60 * 60 * 1000)) // Start 2 months earlier
    const extendedEndDate = new Date(endDate.getTime() + 62 * 24 * 60 * 60 * 1000) // End 2 months later

    console.log("📅 Days Level - Extended Range:", {
      originalStart: startDate.toISOString(),
      extendedStart: currentDate.toISOString(),
      originalEnd: endDate.toISOString(),
      extendedEnd: extendedEndDate.toISOString(),
      bufferDays: 62,
    })

    let segmentIndex = 0
    while (currentDate <= extendedEndDate) {
      const month = currentDate.getMonth()
      const year = currentDate.getFullYear()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const segmentWidth = daysInMonth * pixelsPerDay

      segments.push({
        label: format(currentDate, "MMMM yyyy"),
        width: segmentWidth,
        days: daysInMonth,
        date: new Date(currentDate),
        type: "month",
      })

      if (segmentIndex < 5 || segmentIndex % 10 === 0) {
        console.log(`📊 Segment ${segmentIndex}:`, {
          label: format(currentDate, "MMMM yyyy"),
          width: Math.round(segmentWidth),
          days: daysInMonth,
          date: currentDate.toISOString(),
        })
      }

      currentDate = addMonths(currentDate, 1)
      segmentIndex++
    }

    console.log(`✅ Days Level - Generated ${segments.length} month segments`)
  } else if (currentScale >= 5) {
    // Medium scale - Generate years with months - extend range with buffer to ensure full coverage
    let currentDate = startOfYear(new Date(startDate.getTime() - 2 * 365 * 24 * 60 * 60 * 1000)) // Start 2 years earlier
    const extendedEndDate = new Date(endDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000) // End 2 years later

    console.log("📅 Months Level - Extended Range:", {
      originalStart: startDate.toISOString(),
      extendedStart: currentDate.toISOString(),
      originalEnd: endDate.toISOString(),
      extendedEnd: extendedEndDate.toISOString(),
      bufferYears: 2,
    })

    let segmentIndex = 0
    while (currentDate <= extendedEndDate) {
      const year = currentDate.getFullYear()
      const yearSegment: TimelineSegment = {
        label: format(currentDate, "yyyy"),
        width: 0,
        months: [],
        date: new Date(currentDate),
        type: "year",
      }

      let yearWidth = 0
      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(year, month, 1)
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)
        const daysInMonth = differenceInDays(monthEnd, monthStart) + 1
        const monthWidth = daysInMonth * pixelsPerDay

        yearSegment.months!.push({
          label: format(monthDate, "MMM"),
          width: monthWidth,
          date: new Date(monthDate),
        })
        yearWidth += monthWidth
      }
      yearSegment.width = yearWidth

      segments.push(yearSegment)

      if (segmentIndex < 3) {
        console.log(`📊 Year Segment ${segmentIndex}:`, {
          label: yearSegment.label,
          width: Math.round(yearSegment.width),
          monthsCount: yearSegment.months!.length,
          date: currentDate.toISOString(),
          firstMonth: yearSegment.months![0]?.label,
          lastMonth: yearSegment.months![11]?.label,
        })
      }

      currentDate = addYears(currentDate, 1)
      segmentIndex++
    }

    console.log(`✅ Months Level - Generated ${segments.length} year segments`)
  } else {
    // Low scale - Generate years - extend range with buffer to ensure full coverage
    let currentDate = startOfYear(new Date(startDate.getTime() - 10 * 365 * 24 * 60 * 60 * 1000)) // Start 10 years earlier
    const extendedEndDate = new Date(endDate.getTime() + 10 * 365 * 24 * 60 * 60 * 1000) // End 10 years later

    console.log("📅 Years Level - Extended Range:", {
      originalStart: startDate.toISOString(),
      extendedStart: currentDate.toISOString(),
      originalEnd: endDate.toISOString(),
      extendedEnd: extendedEndDate.toISOString(),
      bufferYears: 10,
    })

    let segmentIndex = 0
    while (currentDate <= extendedEndDate) {
      const yearStart = startOfYear(currentDate)
      const yearEnd = endOfYear(currentDate)
      const daysInYear = differenceInDays(yearEnd, yearStart) + 1
      const yearWidth = daysInYear * pixelsPerDay

      segments.push({
        label: format(currentDate, "yyyy"),
        width: yearWidth,
        date: new Date(currentDate),
        type: "year",
      })

      if (segmentIndex < 5 || segmentIndex % 5 === 0) {
        console.log(`📊 Year Segment ${segmentIndex}:`, {
          label: format(currentDate, "yyyy"),
          width: Math.round(yearWidth),
          days: daysInYear,
          date: currentDate.toISOString(),
        })
      }

      currentDate = addYears(currentDate, 1)
      segmentIndex++
    }

    console.log(`✅ Years Level - Generated ${segments.length} year segments`)
  }

  // Check for gaps and coverage
  if (segments.length === 0) {
    console.error("❌ No timeline segments generated for range:", startDate, "to", endDate)
  } else {
    const firstSegment = segments[0]
    const lastSegment = segments[segments.length - 1]
    const totalWidth = segments.reduce((sum, segment) => sum + segment.width, 0)

    console.log("📏 Coverage Analysis:", {
      totalSegments: segments.length,
      totalWidth: Math.round(totalWidth),
      firstSegmentDate: firstSegment.date.toISOString(),
      lastSegmentDate: lastSegment.date.toISOString(),
      firstSegmentLabel: firstSegment.label,
      lastSegmentLabel: lastSegment.label,
      averageSegmentWidth: Math.round(totalWidth / segments.length),
    })

    // Check for potential gaps between segments
    for (let i = 1; i < Math.min(segments.length, 5); i++) {
      const prevSegment = segments[i - 1]
      const currentSegment = segments[i]
      const expectedNextDate =
        currentScale >= 50 ? addMonths(prevSegment.date, 1) : addYears(prevSegment.date, 1)

      if (currentSegment.date.getTime() !== expectedNextDate.getTime()) {
        console.warn(`⚠️  Potential gap between segments ${i - 1} and ${i}:`, {
          prevDate: prevSegment.date.toISOString(),
          currentDate: currentSegment.date.toISOString(),
          expectedDate: expectedNextDate.toISOString(),
        })
      }
    }
  }

  console.groupEnd()
  return segments
}
