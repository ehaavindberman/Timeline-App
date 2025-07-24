import React from "react"
import type { TimelineSpan } from "../../store/timelineStore"

interface TimelineSpanIndicatorsProps {
  spans: TimelineSpan[]
  calculateDatePosition: (date: Date) => number
  position: number
  canvasWidth: number
}

export const TimelineSpanIndicators: React.FC<TimelineSpanIndicatorsProps> = ({
  spans,
  calculateDatePosition,
  position,
  canvasWidth,
}) => {
  return (
    <>
      {spans.map((span) => {
        const startX = calculateDatePosition(new Date(span.startDate))
        const endX = calculateDatePosition(new Date(span.endDate))
        const spanWidth = endX - startX
        const isVisible =
          endX >= -position - 100 && startX <= -position + canvasWidth + 100

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
    </>
  )
}
