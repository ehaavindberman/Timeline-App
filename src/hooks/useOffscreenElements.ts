
import { useMemo } from "react"
import type { TimelineEvent, TimelineSpan } from "../store/timelineStore"

interface UseOffscreenElementsProps {
  events: TimelineEvent[]
  spans: TimelineSpan[]
  position: number
  canvasRef: React.RefObject<HTMLDivElement>
  calculateDatePosition: (date: Date) => number
  scale: number
}

export interface OffscreenElement {
  id: string
  title: string
  type: 'event' | 'span'
  direction: 'left' | 'right'
  distance: number
  color: string
}

export interface OffscreenElementsResult {
  left: OffscreenElement[]
  right: OffscreenElement[]
}

export const useOffscreenElements = ({
  events,
  spans,
  position,
  canvasRef,
  calculateDatePosition,
  scale,
}: UseOffscreenElementsProps): OffscreenElementsResult => {
  return useMemo(() => {
    if (!canvasRef.current) return { left: [], right: [] }

    const canvasWidth = canvasRef.current.clientWidth
    const viewportLeft = -position
    const viewportRight = viewportLeft + canvasWidth
    const leftElements: OffscreenElement[] = []
    const rightElements: OffscreenElement[] = []

    // Check events
    events.forEach((event) => {
      const eventDate = new Date(event.date)
      const eventPosition = calculateDatePosition(eventDate)

      if (eventPosition < viewportLeft) {
        // Element is off-screen to the left
        leftElements.push({
          id: event.id,
          title: event.title,
          type: 'event',
          direction: 'left',
          distance: Math.round((viewportLeft - eventPosition) / scale), // Distance in days
          color: event.color,
        })
      } else if (eventPosition > viewportRight) {
        // Element is off-screen to the right
        rightElements.push({
          id: event.id,
          title: event.title,
          type: 'event',
          direction: 'right',
          distance: Math.round((eventPosition - viewportRight) / scale), // Distance in days
          color: event.color,
        })
      }
    })

    // Check spans
    spans.forEach((span) => {
      const startDate = new Date(span.startDate)
      const endDate = new Date(span.endDate)
      const startPosition = calculateDatePosition(startDate)
      const endPosition = calculateDatePosition(endDate)

      // Check if entire span is off-screen
      if (endPosition < viewportLeft) {
        // Span is entirely off-screen to the left
        leftElements.push({
          id: span.id,
          title: span.title,
          type: 'span',
          direction: 'left',
          distance: Math.round((viewportLeft - endPosition) / scale), // Distance in days
          color: span.color,
        })
      } else if (startPosition > viewportRight) {
        // Span is entirely off-screen to the right
        rightElements.push({
          id: span.id,
          title: span.title,
          type: 'span',
          direction: 'right',
          distance: Math.round((startPosition - viewportRight) / scale), // Distance in days
          color: span.color,
        })
      }
    })

    // Sort by distance (closest first)
    return {
      left: leftElements.sort((a, b) => a.distance - b.distance),
      right: rightElements.sort((a, b) => a.distance - b.distance)
    }
  }, [events, spans, position, canvasRef, calculateDatePosition, scale])
}
