import React, { useEffect, useState, useRef, Fragment } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { TimelineEvent } from './TimelineEvent';
import { TimelineSpan } from './TimelineSpan';
import { format, addMonths, startOfMonth, endOfMonth, differenceInDays, addYears, startOfYear, endOfYear } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
// Export these constants so they can be imported by other components
export const TIMELINE_START = new Date(2020, 0, 1); // Jan 1, 2020
export const TIMELINE_END = new Date(2025, 11, 31); // Dec 31, 2025
// Enum for different zoom levels
export enum ZoomLevel {
  Days,
  Months,
  Years,
}
export const TimelineCanvas = () => {
  const {
    events,
    spans,
    addEvent,
    addSpan,
    selectElement
  } = useTimelineStore();
  const [scale, setScale] = useState(100); // pixels per day at the most zoomed in level
  const [position, setPosition] = useState(0); // horizontal scroll position
  const [isDragging, setIsDragging] = useState(false);
  const [startDragX, setStartDragX] = useState(0);
  const [startPosition, setStartPosition] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(ZoomLevel.Days);
  const [offscreenElements, setOffscreenElements] = useState<{
    left: {
      id: string;
      color: string;
    }[];
    right: {
      id: string;
      color: string;
    }[];
  }>({
    left: [],
    right: []
  });
  const canvasRef = useRef<HTMLDivElement>(null);
  // Determine zoom level based on scale
  useEffect(() => {
    if (scale >= 50) {
      setZoomLevel(ZoomLevel.Days);
    } else if (scale >= 5) {
      setZoomLevel(ZoomLevel.Months);
    } else {
      setZoomLevel(ZoomLevel.Years);
    }
  }, [scale]);
  // Generate timeline segments based on zoom level
  const generateTimelineSegments = () => {
    let segments = [];
    if (zoomLevel === ZoomLevel.Days) {
      // Generate months with days
      let currentDate = new Date(TIMELINE_START);
      while (currentDate <= TIMELINE_END) {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        segments.push({
          label: format(currentDate, 'MMMM yyyy'),
          width: daysInMonth * scale,
          days: daysInMonth,
          date: new Date(currentDate),
          type: 'month'
        });
        currentDate = addMonths(currentDate, 1);
      }
    } else if (zoomLevel === ZoomLevel.Months) {
      // Generate years with months
      let currentDate = startOfYear(TIMELINE_START);
      while (currentDate <= TIMELINE_END) {
        const year = currentDate.getFullYear();
        const yearSegment = {
          label: format(currentDate, 'yyyy'),
          width: 0,
          months: [] as any[],
          date: new Date(currentDate),
          type: 'year'
        };
        for (let month = 0; month < 12; month++) {
          const monthDate = new Date(year, month, 1);
          if (monthDate > TIMELINE_END) break;
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
          const monthWidth = daysInMonth * (scale / 5); // Adjust scale for months view
          yearSegment.months.push({
            label: format(monthDate, 'MMM'),
            width: monthWidth,
            date: new Date(monthDate)
          });
          yearSegment.width += monthWidth;
        }
        segments.push(yearSegment);
        currentDate = addYears(currentDate, 1);
      }
    } else {
      // Generate years
      let currentDate = startOfYear(TIMELINE_START);
      while (currentDate <= TIMELINE_END) {
        const yearStart = startOfYear(currentDate);
        const yearEnd = endOfYear(currentDate);
        const daysInYear = differenceInDays(yearEnd, yearStart) + 1;
        const yearWidth = daysInYear * (scale / 20); // Adjust scale for years view
        segments.push({
          label: format(currentDate, 'yyyy'),
          width: yearWidth,
          date: new Date(currentDate),
          type: 'year'
        });
        currentDate = addYears(currentDate, 1);
      }
    }
    return segments;
  };
  const timelineSegments = generateTimelineSegments();
  // Calculate total timeline width
  const timelineWidth = timelineSegments.reduce((total, segment) => total + segment.width, 0);
  // Convert position to date and vice versa based on zoom level
  const positionToDate = (xPos: number): Date => {
    if (zoomLevel === ZoomLevel.Days) {
      const dayOffset = Math.round(xPos / scale);
      const date = new Date(TIMELINE_START);
      date.setDate(date.getDate() + dayOffset);
      return date;
    } else if (zoomLevel === ZoomLevel.Months) {
      let accumulatedWidth = 0;
      for (const yearSegment of timelineSegments) {
        for (const month of yearSegment.months) {
          const monthWidth = month.width;
          if (xPos >= accumulatedWidth && xPos < accumulatedWidth + monthWidth) {
            const dayWithinMonth = Math.round((xPos - accumulatedWidth) / (monthWidth / 30));
            const date = new Date(month.date);
            date.setDate(dayWithinMonth + 1);
            return date;
          }
          accumulatedWidth += monthWidth;
        }
      }
      return new Date(TIMELINE_START);
    } else {
      let accumulatedWidth = 0;
      for (const yearSegment of timelineSegments) {
        if (xPos >= accumulatedWidth && xPos < accumulatedWidth + yearSegment.width) {
          const dayWithinYear = Math.round((xPos - accumulatedWidth) / (yearSegment.width / 365));
          const date = new Date(yearSegment.date);
          date.setDate(date.getDate() + dayWithinYear);
          return date;
        }
        accumulatedWidth += yearSegment.width;
      }
      return new Date(TIMELINE_START);
    }
  };
  // Snap x position to nearest day/month/year depending on zoom level
  const snapToGrid = (xPos: number): number => {
    if (zoomLevel === ZoomLevel.Days) {
      return Math.round(xPos / scale) * scale;
    } else if (zoomLevel === ZoomLevel.Months) {
      let accumulatedWidth = 0;
      for (const yearSegment of timelineSegments) {
        for (const month of yearSegment.months) {
          const monthWidth = month.width;
          if (xPos >= accumulatedWidth && xPos < accumulatedWidth + monthWidth) {
            const ratio = (xPos - accumulatedWidth) / monthWidth;
            return accumulatedWidth + Math.round(ratio * monthWidth);
          }
          accumulatedWidth += monthWidth;
        }
      }
      return xPos;
    } else {
      let accumulatedWidth = 0;
      for (const yearSegment of timelineSegments) {
        if (xPos >= accumulatedWidth && xPos < accumulatedWidth + yearSegment.width) {
          const ratio = (xPos - accumulatedWidth) / yearSegment.width;
          return accumulatedWidth + Math.round(ratio * yearSegment.width);
        }
        accumulatedWidth += yearSegment.width;
      }
      return xPos;
    }
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartDragX(e.clientX);
    setStartPosition(position);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - startDragX;
      setPosition(Math.min(0, Math.max(startPosition + deltaX, -timelineWidth + (canvasRef.current?.clientWidth || 0))));
    }
  };
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left - position;
      const x = snapToGrid(rawX); // Snap to grid
      const date = positionToDate(x);
      addEvent({
        id: `event-${Date.now()}`,
        title: `📌 New Event`,
        date: date.toISOString(),
        x: x,
        color: '#3b82f6'
      });
    }
  };
  // Handle wheel events for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (canvasRef.current) {
      // Get mouse position relative to the canvas
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      // Calculate the date under the mouse before zooming
      const dateUnderMouse = positionToDate(mouseX - position);
      // Adjust scale based on wheel direction
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; // Zoom out (0.9) or in (1.1)
      const newScale = Math.max(1, Math.min(100, scale * zoomFactor));
      setScale(newScale);
      // Recalculate position to keep the date under the mouse at the same position
      // This is a bit complex and may need adjustment based on the new date-to-position calculation
      setTimeout(() => {
        // We use setTimeout to ensure the zoom level and segments are updated
        const segments = generateTimelineSegments();
        let newPosition = position;
        // Find the new position for the date that was under the mouse
        let accumulatedWidth = 0;
        let found = false;
        if (zoomLevel === ZoomLevel.Days) {
          const daysDiff = differenceInDays(dateUnderMouse, TIMELINE_START);
          const newPosForDate = daysDiff * newScale;
          newPosition = -(newPosForDate - mouseX);
        } else if (zoomLevel === ZoomLevel.Months) {
          for (const yearSegment of segments) {
            for (const month of yearSegment.months) {
              const monthStart = startOfMonth(month.date);
              const monthEnd = endOfMonth(month.date);
              if (dateUnderMouse >= monthStart && dateUnderMouse <= monthEnd) {
                const daysIntoMonth = differenceInDays(dateUnderMouse, monthStart);
                const ratio = daysIntoMonth / differenceInDays(monthEnd, monthStart);
                const newPosForDate = accumulatedWidth + month.width * ratio;
                newPosition = -(newPosForDate - mouseX);
                found = true;
                break;
              }
              accumulatedWidth += month.width;
            }
            if (found) break;
          }
        } else {
          for (const yearSegment of segments) {
            const yearStart = startOfYear(yearSegment.date);
            const yearEnd = endOfYear(yearSegment.date);
            if (dateUnderMouse >= yearStart && dateUnderMouse <= yearEnd) {
              const daysIntoYear = differenceInDays(dateUnderMouse, yearStart);
              const ratio = daysIntoYear / differenceInDays(yearEnd, yearStart);
              const newPosForDate = accumulatedWidth + yearSegment.width * ratio;
              newPosition = -(newPosForDate - mouseX);
              break;
            }
            accumulatedWidth += yearSegment.width;
          }
        }
        // Ensure the position doesn't go out of bounds
        newPosition = Math.min(0, Math.max(newPosition, -timelineWidth + (canvasRef.current?.clientWidth || 0)));
        setPosition(newPosition);
      }, 0);
    }
  };
  const handleZoom = (factor: number) => {
    // Similar to wheel zoom but centered on the middle of the viewport
    if (canvasRef.current) {
      const centerX = canvasRef.current.clientWidth / 2;
      // Calculate the date under the center before zooming
      const dateUnderCenter = positionToDate(centerX - position);
      // Adjust scale
      const newScale = Math.max(1, Math.min(100, scale * factor));
      setScale(newScale);
      // Recalculate position to keep the center date at the same position
      setTimeout(() => {
        // We use setTimeout to ensure the zoom level and segments are updated
        const segments = generateTimelineSegments();
        let newPosition = position;
        // Find the new position for the date that was at the center
        let accumulatedWidth = 0;
        let found = false;
        if (zoomLevel === ZoomLevel.Days) {
          const daysDiff = differenceInDays(dateUnderCenter, TIMELINE_START);
          const newPosForDate = daysDiff * newScale;
          newPosition = -(newPosForDate - centerX);
        } else if (zoomLevel === ZoomLevel.Months) {
          for (const yearSegment of segments) {
            for (const month of yearSegment.months) {
              const monthStart = startOfMonth(month.date);
              const monthEnd = endOfMonth(month.date);
              if (dateUnderCenter >= monthStart && dateUnderCenter <= monthEnd) {
                const daysIntoMonth = differenceInDays(dateUnderCenter, monthStart);
                const ratio = daysIntoMonth / differenceInDays(monthEnd, monthStart);
                const newPosForDate = accumulatedWidth + month.width * ratio;
                newPosition = -(newPosForDate - centerX);
                found = true;
                break;
              }
              accumulatedWidth += month.width;
            }
            if (found) break;
          }
        } else {
          for (const yearSegment of segments) {
            const yearStart = startOfYear(yearSegment.date);
            const yearEnd = endOfYear(yearSegment.date);
            if (dateUnderCenter >= yearStart && dateUnderCenter <= yearEnd) {
              const daysIntoYear = differenceInDays(dateUnderCenter, yearStart);
              const ratio = daysIntoYear / differenceInDays(yearEnd, yearStart);
              const newPosForDate = accumulatedWidth + yearSegment.width * ratio;
              newPosition = -(newPosForDate - centerX);
              break;
            }
            accumulatedWidth += yearSegment.width;
          }
        }
        // Ensure the position doesn't go out of bounds
        newPosition = Math.min(0, Math.max(newPosition, -timelineWidth + (canvasRef.current?.clientWidth || 0)));
        setPosition(newPosition);
      }, 0);
    }
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=' && e.ctrlKey) {
        e.preventDefault();
        handleZoom(1.2);
      } else if (e.key === '-' || e.key === '-' && e.ctrlKey) {
        e.preventDefault();
        handleZoom(0.8);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale, position]);
  // Add to global window so other components can access it
  useEffect(() => {
    ;
    (window as any).timelineConfig = {
      scale,
      startDate: TIMELINE_START,
      zoomLevel,
      positionToDate: positionToDate,
      calculateDatePosition,
      centerOnElement
    };
  }, [scale, zoomLevel, events, spans]);
  // Calculate date position based on zoom level
  const calculateDatePosition = (date: Date): number => {
    if (zoomLevel === ZoomLevel.Days) {
      const diffTime = date.getTime() - TIMELINE_START.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays * scale;
    } else if (zoomLevel === ZoomLevel.Months) {
      let accumulatedWidth = 0;
      const dateYear = date.getFullYear();
      const dateMonth = date.getMonth();
      const dateDay = date.getDate();
      for (const yearSegment of timelineSegments) {
        const year = yearSegment.date.getFullYear();
        if (year === dateYear) {
          for (let i = 0; i < yearSegment.months.length; i++) {
            const month = yearSegment.months[i];
            const monthIndex = month.date.getMonth();
            if (monthIndex === dateMonth) {
              const monthStart = startOfMonth(month.date);
              const monthEnd = endOfMonth(month.date);
              const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
              const dayRatio = (dateDay - 1) / daysInMonth;
              return accumulatedWidth + month.width * dayRatio;
            }
            accumulatedWidth += month.width;
          }
        } else {
          accumulatedWidth += yearSegment.width;
        }
      }
      return accumulatedWidth;
    } else {
      let accumulatedWidth = 0;
      const dateYear = date.getFullYear();
      for (const yearSegment of timelineSegments) {
        const year = yearSegment.date.getFullYear();
        if (year === dateYear) {
          const yearStart = startOfYear(yearSegment.date);
          const dayOfYear = differenceInDays(date, yearStart);
          const daysInYear = differenceInDays(endOfYear(yearSegment.date), yearStart) + 1;
          return accumulatedWidth + yearSegment.width * (dayOfYear / daysInYear);
        }
        accumulatedWidth += yearSegment.width;
      }
      return accumulatedWidth;
    }
  };
  // Center on a specific element by ID
  const centerOnElement = (elementId: string) => {
    // Find the element in events or spans
    const event = events.find(e => e.id === elementId);
    const span = spans.find(s => s.id === elementId);
    if (canvasRef.current) {
      const canvasWidth = canvasRef.current.clientWidth;
      if (event) {
        // For events, center on the x position
        const eventX = calculateDatePosition(new Date(event.date));
        const newPosition = -(eventX - canvasWidth / 2);
        // Ensure the position doesn't go out of bounds
        setPosition(Math.min(0, Math.max(newPosition, -timelineWidth + canvasWidth)));
        // Also select the element
        selectElement(elementId);
      } else if (span) {
        // For spans, center on the middle of the span
        const spanStartX = calculateDatePosition(new Date(span.startDate));
        const spanEndX = calculateDatePosition(new Date(span.endDate));
        const spanCenterX = spanStartX + (spanEndX - spanStartX) / 2;
        const newPosition = -(spanCenterX - canvasWidth / 2);
        // Ensure the position doesn't go out of bounds
        setPosition(Math.min(0, Math.max(newPosition, -timelineWidth + canvasWidth)));
        // Also select the element
        selectElement(elementId);
      }
    }
  };
  // Check for off-screen elements
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const visibleLeftEdge = -position;
    const visibleRightEdge = -position + canvasRect.width;
    const leftOffscreen: {
      id: string;
      color: string;
    }[] = [];
    const rightOffscreen: {
      id: string;
      color: string;
    }[] = [];
    // Check events
    events.forEach(event => {
      const eventX = calculateDatePosition(new Date(event.date));
      if (eventX < visibleLeftEdge) {
        leftOffscreen.push({
          id: event.id,
          color: event.color
        });
      } else if (eventX > visibleRightEdge) {
        rightOffscreen.push({
          id: event.id,
          color: event.color
        });
      }
    });
    // Check spans
    spans.forEach(span => {
      const spanStartX = calculateDatePosition(new Date(span.startDate));
      const spanEndX = calculateDatePosition(new Date(span.endDate));
      // If the span is completely off-screen to the left
      if (spanEndX < visibleLeftEdge) {
        leftOffscreen.push({
          id: span.id,
          color: span.color
        });
      }
      // If the span is completely off-screen to the right
      else if (spanStartX > visibleRightEdge) {
        rightOffscreen.push({
          id: span.id,
          color: span.color
        });
      }
    });
    setOffscreenElements({
      left: leftOffscreen,
      right: rightOffscreen
    });
  }, [events, spans, position, scale, zoomLevel]);
  // Render the appropriate timeline ruler based on zoom level
  const renderTimelineRuler = () => {
    if (zoomLevel === ZoomLevel.Days) {
      return <div className="flex h-full">
          {timelineSegments.map((month, index) => <div key={index} className="flex flex-col border-r border-slate-200" style={{
          width: `${month.width}px`
        }} data-timeline-segment data-date={month.date.toISOString()}>
              <div className="h-8 px-2 flex items-center text-sm font-medium text-slate-600 border-b border-slate-200">
                {month.label}
              </div>
              <div className="flex h-8">
                {Array.from({
              length: month.days
            }).map((_, dayIndex) => <div key={dayIndex} className="border-r border-slate-200 flex items-center justify-center text-xs text-slate-500" style={{
              width: `${scale}px`
            }}>
                    {dayIndex + 1}
                  </div>)}
              </div>
            </div>)}
        </div>;
    } else if (zoomLevel === ZoomLevel.Months) {
      return <div className="flex h-full">
          {timelineSegments.map((year, yearIndex) => <div key={yearIndex} className="flex flex-col border-r border-slate-200" style={{
          width: `${year.width}px`
        }} data-timeline-segment data-date={year.date.toISOString()}>
              <div className="h-8 px-2 flex items-center text-sm font-medium text-slate-600 border-b border-slate-200">
                {year.label}
              </div>
              <div className="flex h-8">
                {year.months.map((month, monthIndex) => <div key={monthIndex} className="border-r border-slate-200 flex items-center justify-center text-xs text-slate-500" style={{
              width: `${month.width}px`
            }} data-month-segment data-date={month.date.toISOString()}>
                    {month.label}
                  </div>)}
              </div>
            </div>)}
        </div>;
    } else {
      return <div className="flex h-full">
          {timelineSegments.map((year, yearIndex) => <div key={yearIndex} className="flex flex-col border-r border-slate-200" style={{
          width: `${year.width}px`
        }} data-timeline-segment data-date={year.date.toISOString()}>
              <div className="h-16 px-2 flex items-center justify-center text-sm font-medium text-slate-600">
                {year.label}
              </div>
            </div>)}
        </div>;
    }
  };
  return <div className="relative flex-1 overflow-hidden bg-white">
      <div className="absolute top-4 right-4 flex space-x-2 z-10">
        <button onClick={() => handleZoom(0.8)} className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50">
          <span className="text-lg font-bold">-</span>
        </button>
        <button onClick={() => handleZoom(1.2)} className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50">
          <span className="text-lg font-bold">+</span>
        </button>
      </div>
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10" onClick={() => setPosition(Math.min(0, position + 300))}>
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50">
          <ChevronLeftIcon size={20} />
        </button>
      </div>
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10" onClick={() => setPosition(Math.max(-timelineWidth + (canvasRef.current?.clientWidth || 0), position - 300))}>
        <button className="p-2 bg-white rounded-full shadow-md hover:bg-slate-50">
          <ChevronRightIcon size={20} />
        </button>
      </div>
      {/* Off-screen indicators */}
      <div className="absolute inset-y-0 left-0 flex flex-col items-start justify-center pointer-events-none z-20">
        {offscreenElements.left.map((elem, index) => <div key={`left-${elem.id}`} className="ml-1 my-1 w-3 h-3 rounded-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity pointer-events-auto" style={{
        backgroundColor: elem.color
      }} onClick={() => centerOnElement(elem.id)} title="Click to center this element" />)}
      </div>
      <div className="absolute inset-y-0 right-0 flex flex-col items-end justify-center pointer-events-none z-20">
        {offscreenElements.right.map((elem, index) => <div key={`right-${elem.id}`} className="mr-1 my-1 w-3 h-3 rounded-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity pointer-events-auto" style={{
        backgroundColor: elem.color
      }} onClick={() => centerOnElement(elem.id)} title="Click to center this element" />)}
      </div>
      <div id="timeline-canvas" ref={canvasRef} className="h-full w-full overflow-hidden cursor-grab" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onDoubleClick={handleDoubleClick} onWheel={handleWheel} style={{
      cursor: isDragging ? 'grabbing' : 'grab'
    }}>
        <div className="relative h-full" style={{
        width: `${timelineWidth}px`,
        transform: `translateX(${position}px)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
      }}>
          {/* Timeline ruler */}
          <div className="sticky top-0 z-10 h-16 bg-white border-b border-slate-200">
            {renderTimelineRuler()}
          </div>
          {/* Timeline content */}
          <div className="relative h-[calc(100%-4rem)] pt-8">
            {/* Time spans */}
            {spans.map(span => <TimelineSpan key={span.id} span={span} calculateDatePosition={calculateDatePosition} zoomLevel={zoomLevel} />)}
            {/* Events */}
            {events.map(event => <TimelineEvent key={event.id} event={event} calculateDatePosition={calculateDatePosition} zoomLevel={zoomLevel} />)}
            {/* Guidelines - adjust based on zoom level */}
            {zoomLevel === ZoomLevel.Days && timelineSegments.map((segment, index) => <div key={index} className="absolute top-0 bottom-0 border-r border-slate-100" style={{
            left: `${index > 0 ? timelineSegments.slice(0, index).reduce((acc, s) => acc + s.width, 0) : 0}px`
          }} />)}
            {zoomLevel === ZoomLevel.Months && timelineSegments.map((yearSegment, yearIndex) => <Fragment key={yearIndex}>
                  <div className="absolute top-0 bottom-0 border-r border-slate-200" style={{
              left: `${yearIndex > 0 ? timelineSegments.slice(0, yearIndex).reduce((acc, s) => acc + s.width, 0) : 0}px`
            }} />
                  {yearSegment.months.map((month, monthIndex) => {
              const prevMonthsWidth = yearSegment.months.slice(0, monthIndex).reduce((acc, m) => acc + m.width, 0);
              const prevYearsWidth = timelineSegments.slice(0, yearIndex).reduce((acc, s) => acc + s.width, 0);
              return <div key={`${yearIndex}-${monthIndex}`} className="absolute top-0 bottom-0 border-r border-slate-100" style={{
                left: `${prevYearsWidth + prevMonthsWidth}px`
              }} />;
            })}
                </Fragment>)}
            {zoomLevel === ZoomLevel.Years && timelineSegments.map((segment, index) => <div key={index} className="absolute top-0 bottom-0 border-r border-slate-100" style={{
            left: `${index > 0 ? timelineSegments.slice(0, index).reduce((acc, s) => acc + s.width, 0) : 0}px`
          }} />)}
          </div>
        </div>
      </div>
    </div>;
};