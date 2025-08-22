
import { positionToDate as positionToDateUtil } from "./timelineCalculations"

export interface VisibleDateRange {
  startDate: Date
  endDate: Date
  canvasWidth: number
  buffer: number
}

/**
 * Calculate the visible date range based on current position and canvas dimensions
 * @param position - Current horizontal scroll position
 * @param canvasWidth - Width of the canvas viewport
 * @param scale - Current scale (pixels per day)
 * @param bufferMultiplier - Multiplier for buffer calculation (default: 2)
 * @returns Object containing start/end dates and viewport info
 */
export const getVisibleDateRange = (
  position: number,
  canvasWidth: number,
  scale: number,
  bufferMultiplier: number = 2
): VisibleDateRange => {
  const fallbackWidth = 1200
  const actualCanvasWidth = canvasWidth || fallbackWidth
  const buffer = Math.max(actualCanvasWidth * bufferMultiplier, 2400)

  // Calculate the absolute timeline positions correctly
  // position is the CSS transform offset, so we need to convert to absolute timeline coordinates
  const viewportLeftEdge = -position // Left edge of visible area in timeline coordinates
  const viewportRightEdge = -position + actualCanvasWidth // Right edge of visible area

  // Add buffer to get the range we need to generate segments for
  const visibleStartX = viewportLeftEdge - buffer
  const visibleEndX = viewportRightEdge + buffer

  console.log("📍 FIXED getVisibleDateRange Debug:", {
    position: Math.round(position),
    canvasWidth: actualCanvasWidth,
    buffer,
    viewportLeftEdge: Math.round(viewportLeftEdge),
    viewportRightEdge: Math.round(viewportRightEdge),
    visibleStartX: Math.round(visibleStartX),
    visibleEndX: Math.round(visibleEndX),
    viewportCenter: Math.round(viewportLeftEdge + actualCanvasWidth / 2),
  })

  const startDate = positionToDateUtil(visibleStartX, scale)
  const endDate = positionToDateUtil(visibleEndX, scale)

  // Verify the center calculation
  const centerX = viewportLeftEdge + actualCanvasWidth / 2
  const centerDate = positionToDateUtil(centerX, scale)

  console.log("📅 Date Range Verification:", {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    centerX: Math.round(centerX),
    centerDate: centerDate.toISOString(),
    expectedCenter: "Should be around April 2023 initially",
  })

  return { 
    startDate, 
    endDate, 
    canvasWidth: actualCanvasWidth, 
    buffer 
  }
}
