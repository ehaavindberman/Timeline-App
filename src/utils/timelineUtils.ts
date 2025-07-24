import type { TimelineEvent, TimelineSpan } from "../store/timelineStore"

/**
 * Centers the timeline view on a specific element (event or span)
 * @param elementId - The ID of the element to center on
 * @param events - Array of timeline events
 * @param spans - Array of timeline spans
 * @param calculateDatePosition - Function to calculate x position from date
 * @param setPosition - Function to update timeline position
 * @param selectElement - Function to select the element
 * @param canvasWidth - Width of the canvas
 */
export const centerOnElement = (
  elementId: string,
  events: TimelineEvent[],
  spans: TimelineSpan[],
  calculateDatePosition: (date: Date) => number,
  setPosition: (position: number) => void,
  selectElement: (id: string) => void,
  canvasWidth: number
) => {
  // Find the element in events or spans
  const event = events.find((e) => e.id === elementId)
  const span = spans.find((s) => s.id === elementId)

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
