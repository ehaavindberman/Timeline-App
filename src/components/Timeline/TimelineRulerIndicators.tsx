import React from "react"
import type { TimelineEvent, TimelineSpan } from "../../store/timelineStore"
import { TimelineEventIndicators } from "./TimelineEventIndicators"
import { TimelineSpanIndicators } from "./TimelineSpanIndicators"

interface TimelineRulerIndicatorsProps {
  events: TimelineEvent[]
  spans: TimelineSpan[]
  calculateDatePosition: (date: Date) => number
  position: number
  canvasWidth: number
}

export const TimelineRulerIndicators: React.FC<TimelineRulerIndicatorsProps> = ({
  events,
  spans,
  calculateDatePosition,
  position,
  canvasWidth,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-20">
      {/* Event indicators */}
      <TimelineEventIndicators
        events={events}
        calculateDatePosition={calculateDatePosition}
        position={position}
        canvasWidth={canvasWidth}
      />

      {/* Span indicators */}
      <TimelineSpanIndicators
        spans={spans}
        calculateDatePosition={calculateDatePosition}
        position={position}
        canvasWidth={canvasWidth}
      />
    </div>
  )
}
