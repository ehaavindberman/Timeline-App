
import React, { useMemo } from "react"
import { format } from "date-fns"
import { REFERENCE_DATE } from "../../utils/timelineCalculations"

// Enum for different zoom levels (kept for compatibility)
export enum ZoomLevel {
  Days = 0,
  Months = 1,
  Years = 2,
}

// Type for timeline segments
type TimelineSegment = {
  label: string
  width: number
  date: Date
  days?: number
  months?: Array<{
    label: string
    width: number
    date: Date
  }>
}

interface TimelineRulerProps {
  zoomLevel: ZoomLevel
  firstSegmentPosition: number
  currentTimelineSegments: TimelineSegment[]
  scale: number
  position: number
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  zoomLevel,
  firstSegmentPosition,
  currentTimelineSegments,
  scale,
  position,
}) => {
  // Generate ruler segments based on the current visible range
  const rulerSegments = useMemo(() => {
    const segments: Array<{
      date: Date
      label: string
      position: number
      isMainTick: boolean
      tickHeight: 'small' | 'medium' | 'large'
    }> = []

    // Calculate positions for each timeline segment
    let cumulativeWidth = 0
    
    currentTimelineSegments.forEach((segment, index) => {
      const segmentPosition = firstSegmentPosition + cumulativeWidth
      
      if (zoomLevel === ZoomLevel.Years) {
        // For years, show year labels
        segments.push({
          date: segment.date,
          label: segment.label,
          position: segmentPosition,
          isMainTick: true,
          tickHeight: 'large'
        })
      } else if (zoomLevel === ZoomLevel.Months && segment.months) {
        // For months, show year and month labels
        segments.push({
          date: segment.date,
          label: segment.label,
          position: segmentPosition,
          isMainTick: true,
          tickHeight: 'large'
        })
        
        let monthCumulativeWidth = 0
        segment.months.forEach((month) => {
          const monthPosition = segmentPosition + monthCumulativeWidth
          segments.push({
            date: month.date,
            label: month.label,
            position: monthPosition,
            isMainTick: false,
            tickHeight: 'medium'
          })
          monthCumulativeWidth += month.width
        })
      } else if (zoomLevel === ZoomLevel.Days) {
        // For days, show more detailed labels
        segments.push({
          date: segment.date,
          label: format(segment.date, 'MMM d'),
          position: segmentPosition,
          isMainTick: true,
          tickHeight: 'medium'
        })
      }
      
      cumulativeWidth += segment.width
    })

    return segments
  }, [currentTimelineSegments, firstSegmentPosition, zoomLevel])

  return (
    <div className="relative h-full bg-white border-b border-slate-200">
      {/* Ruler segments */}
      {rulerSegments.map((segment, index) => (
        <div
          key={`ruler-${segment.date.getTime()}-${index}`}
          className="absolute top-0 flex flex-col items-start"
          style={{
            left: `${segment.position}px`,
            height: '100%',
          }}
        >
          {/* Tick mark */}
          <div
            className={`border-l ${
              segment.isMainTick ? 'border-slate-400' : 'border-slate-300'
            }`}
            style={{
              height: segment.tickHeight === 'large' ? '24px' : segment.tickHeight === 'medium' ? '16px' : '8px',
              marginTop: segment.tickHeight === 'large' ? '8px' : '16px',
            }}
          />
          
          {/* Label */}
          <div
            className={`text-xs ${
              segment.isMainTick ? 'text-slate-700 font-medium' : 'text-slate-500'
            } mt-1 whitespace-nowrap select-none`}
            style={{
              marginLeft: '4px',
            }}
          >
            {segment.label}
          </div>
        </div>
      ))}
    </div>
  )
}
