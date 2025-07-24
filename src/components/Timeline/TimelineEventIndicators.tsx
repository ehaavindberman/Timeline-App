import React from "react"
import type { TimelineEvent } from "../../store/timelineStore"

interface TimelineEventIndicatorsProps {
  events: TimelineEvent[]
  calculateDatePosition: (date: Date) => number
  position: number
  canvasWidth: number
}

export const TimelineEventIndicators: React.FC<TimelineEventIndicatorsProps> = ({
  events,
  calculateDatePosition,
  position,
  canvasWidth,
}) => {
  return (
    <>
      {events.map((event) => {
        const eventX = calculateDatePosition(new Date(event.date))
        const isVisible =
          eventX >= -position - 100 && eventX <= -position + canvasWidth + 100

        if (!isVisible) return null

        return (
          <div
            key={`ruler-event-${event.id}`}
            className="absolute top-0 bottom-0 flex items-end justify-center pb-1"
            style={{
              left: `${eventX}px`,
              transform: "translateX(-50%)",
            }}
          >
            <div
              className="w-2 h-2 rounded-full border border-white shadow-sm"
              style={{
                backgroundColor: event.color,
              }}
              title={event.title}
            />
          </div>
        )
      })}
    </>
  )
}
