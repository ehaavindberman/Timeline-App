import { ZoomLevel } from "./timelineSegments"

// Default reference date for calculations (can be any date)
export const REFERENCE_DATE = new Date(2023, 0, 1) // Jan 1, 2023

/**
 * Converts a pixel position to a date based on the reference date and current scale/zoom level
 * @param xPos - The x position in pixels
 * @param scale - The current scale value
 * @param zoomLevel - The current zoom level
 * @returns The corresponding Date object
 */
export const positionToDate = (xPos: number, scale: number, zoomLevel: ZoomLevel): Date => {
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
}

/**
 * Converts a date to a pixel position based on the reference date and current scale/zoom level
 * @param date - The date to convert
 * @param scale - The current scale value
 * @param zoomLevel - The current zoom level
 * @returns The corresponding x position in pixels
 */
export const calculateDatePosition = (date: Date, scale: number, zoomLevel: ZoomLevel): number => {
  const diffTime = date.getTime() - REFERENCE_DATE.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24) // More precise - don't round here

  if (zoomLevel === ZoomLevel.Days) {
    return diffDays * scale
  } else if (zoomLevel === ZoomLevel.Months) {
    return diffDays * (scale / 5)
  } else {
    return diffDays * (scale / 20)
  }
}

/**
 * Determines the appropriate zoom level based on the current scale value
 * @param currentScale - The current scale value
 * @returns The corresponding ZoomLevel
 */
export const getZoomLevelFromScale = (currentScale: number): ZoomLevel => {
  if (currentScale >= 50) {
    return ZoomLevel.Days
  } else if (currentScale >= 5) {
    return ZoomLevel.Months
  } else {
    return ZoomLevel.Years
  }
}
