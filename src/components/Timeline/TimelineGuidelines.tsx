import React, { Fragment } from "react"

// Enum for different zoom levels
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

interface TimelineGuidelinesProps {
  zoomLevel: ZoomLevel
  currentTimelineSegments: TimelineSegment[]
  firstSegmentPosition: number
}

export const TimelineGuidelines: React.FC<TimelineGuidelinesProps> = ({
  zoomLevel,
  currentTimelineSegments,
  firstSegmentPosition,
}) => {
  return (
    <>
      {/* Guidelines - dynamically generated based on visible segments */}
      {zoomLevel === ZoomLevel.Days &&
        currentTimelineSegments.map((segment, index) => (
          <div
            key={`guideline-${segment.date.getTime()}-${index}`}
            className="absolute top-0 bottom-0 border-r border-slate-100 select-none z-1"
            style={{
              left: `${firstSegmentPosition + (index > 0 ? currentTimelineSegments.slice(0, index).reduce((acc, s) => acc + s.width, 0) : 0)}px`,
            }}
          />
        ))}
      {zoomLevel === ZoomLevel.Months &&
        currentTimelineSegments.map((yearSegment, yearIndex) => (
          <Fragment key={`year-guidelines-${yearSegment.date.getTime()}-${yearIndex}`}>
            <div
              className="absolute top-0 bottom-0 border-r border-slate-200 select-none z-1"
              style={{
                left: `${firstSegmentPosition + (yearIndex > 0 ? currentTimelineSegments.slice(0, yearIndex).reduce((acc, s) => acc + s.width, 0) : 0)}px`,
              }}
            />
            {yearSegment.months?.map((month, monthIndex) => {
              const prevMonthsWidth = yearSegment.months?.slice(0, monthIndex).reduce((acc, m) => acc + m.width, 0) || 0
              const prevYearsWidth = currentTimelineSegments
                .slice(0, yearIndex)
                .reduce((acc, s) => acc + s.width, 0)
              return (
                <div
                  key={`month-guideline-${month.date.getTime()}-${monthIndex}`}
                  className="absolute top-0 bottom-0 border-r border-slate-100 select-none z-1"
                  style={{
                    left: `${firstSegmentPosition + prevYearsWidth + prevMonthsWidth}px`,
                  }}
                />
              )
            })}
          </Fragment>
        ))}
      {zoomLevel === ZoomLevel.Years &&
        currentTimelineSegments.map((segment, index) => (
          <div
            key={`year-guideline-${segment.date.getTime()}-${index}`}
            className="absolute top-0 bottom-0 border-r border-slate-100 select-none z-1"
            style={{
              left: `${firstSegmentPosition + (index > 0 ? currentTimelineSegments.slice(0, index).reduce((acc, s) => acc + s.width, 0) : 0)}px`,
            }}
          />
        ))}
    </>
  )
}
