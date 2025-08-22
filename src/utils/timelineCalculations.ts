// Default reference date for calculations (can be any date)
export const REFERENCE_DATE = new Date(2023, 0, 1) // Jan 1, 2023

/**
 * Converts a pixel position to a date based on the reference date and current scale
 * @param xPos - The x position in pixels
 * @param scale - The current scale value (pixels per day)
 * @returns The corresponding Date object
 */
export const positionToDate = (xPos: number, scale: number): Date => {
  // Scale is always pixels per day
  const dayOffset = xPos / scale

  // Use more precise date calculation
  const millisecondsOffset = dayOffset * 24 * 60 * 60 * 1000
  return new Date(REFERENCE_DATE.getTime() + millisecondsOffset)
}

/**
 * Converts a date to a pixel position based on the reference date and current scale
 * @param date - The date to convert
 * @param scale - The current scale value (pixels per day)
 * @returns The corresponding x position in pixels
 */
export const calculateDatePosition = (date: Date, scale: number): number => {
  const diffTime = date.getTime() - REFERENCE_DATE.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24) // More precise - don't round here

  // Scale is always pixels per day
  return diffDays * scale
}
