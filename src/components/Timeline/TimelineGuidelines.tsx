import React from "react"
import { useMemo } from "react"
import { generateRulerSegments } from "../../utils/timelineSegments";

interface TimelineGuidelinesProps {
  scale: number
  startDate: Date
  endDate: Date
}

export const TimelineGuidelines: React.FC<TimelineGuidelinesProps> = ({
  scale, startDate, endDate,
}) => {
  
  // Generate ruler segments for guidelines
  const rulerSegments = useMemo(() => {
    return generateRulerSegments(scale, startDate, endDate);
  }, [scale, startDate, endDate]);

  return (
    <>
      {/* Guidelines - dynamically generated based on visible segments */}
      {rulerSegments.map((segment, index) => {
        return (
          <div
            key={`guideline-${segment.date.getTime()}-${index}`}
            className="absolute top-0 bottom-0 border-r border-slate-100 select-none z-1"
            style={{
              left: `${segment.position}px`,
            }}
          />
        );
      })}
    </>
  )
}
