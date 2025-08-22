import React, { useMemo } from "react"
import { generateRulerSegments, type RulerSegment } from "../../utils/timelineSegments"
import { getVisibleDateRange } from "../../utils/timelineViewport"

interface TimelineRulerProps {
  scale: number
  position?: number // Current scroll position from TimelineCanvas
  currentTimelineSegments?: RulerSegment[] // New prop for segments
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  scale,
  position = 0,
  currentTimelineSegments,
}) => {
  
  // Calculate visible date range based on position and scale
  const visibleRange = useMemo(() => {
    // Estimate canvas width (this could be passed as prop in the future)
    const canvasWidth = 1200
    return getVisibleDateRange(-position, canvasWidth, scale)
  }, [position, scale])
  
  // Generate ruler segments based on current scale
  const rulerSegments = useMemo(() => {
    // If segments are provided as props, use them; otherwise generate them
    if (currentTimelineSegments) {
      return currentTimelineSegments
    }
    
    return generateRulerSegments(scale, visibleRange.startDate, visibleRange.endDate)
  }, [scale, visibleRange, currentTimelineSegments])
  
  return (
    <div className="relative h-full w-full select-none overflow-hidden">
      {/* Main ruler line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-300" />
      
      {/* Ruler segments */}
      {rulerSegments.map((segment, index) => {
        const tickHeight = segment.tickHeight === 'large' ? 'h-4' : 
                          segment.tickHeight === 'medium' ? 'h-3' : 'h-2'
        const textSize = segment.isMainTick ? 'text-sm font-medium' : 'text-xs'
        const textColor = segment.isMainTick ? 'text-slate-700' : 'text-slate-500'
        
        return (
          <div
            key={`${segment.date.getTime()}-${index}`}
            className="absolute bottom-0 flex flex-col items-center select-none"
            style={{
              left: `${segment.position}px`,
              transform: 'translateX(-50%)'
            }}
          >
            {/* Tick mark */}
            <div className={`w-px bg-slate-400 ${tickHeight}`} />
            
            {/* Label */}
            <div className={`mt-2 mb-3 px-1 whitespace-nowrap ${textSize} ${textColor} select-none`}>
              {segment.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
