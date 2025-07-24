import { useEffect, useState } from "react"
import type { TimelineEvent, TimelineSpan } from "../store/timelineStore"

// Type for offscreen element data
export type OffscreenElement = {
  id: string
  color: string
}

export type OffscreenElements = {
  left: OffscreenElement[]
  right: OffscreenElement[]
}

interface UseOffscreenElementsProps {
  events: TimelineEvent[]
  spans: TimelineSpan[]
  position: number
  canvasRef: React.RefObject<HTMLDivElement | null>
  calculateDatePosition: (date: Date) => number
  scale: number
  zoomLevel: number
}

/**
 * Custom hook to calculate which timeline elements are offscreen (outside the visible viewport)
 * Returns the offscreen elements categorized by left and right sides
 */
export const useOffscreenElements = ({
  events,
  spans,
  position,
  canvasRef,
  calculateDatePosition,
  scale,
  zoomLevel,
}: UseOffscreenElementsProps): OffscreenElements => {
  const [offscreenElements, setOffscreenElements] = useState<OffscreenElements>({
    left: [],
    right: [],
  })

  useEffect(() => {
    if (!canvasRef.current) return

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const visibleLeftEdge = -position
    const visibleRightEdge = -position + canvasRect.width
    const leftOffscreen: OffscreenElement[] = []
    const rightOffscreen: OffscreenElement[] = []

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

  return offscreenElements
}
