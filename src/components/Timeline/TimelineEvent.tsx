import React, { useEffect, useState } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { ZoomLevel } from './TimelineCanvas';
type TimelineEventProps = {
  event: {
    id: string;
    title: string;
    date: string;
    x: number;
    color: string;
  };
  calculateDatePosition: (date: Date) => number;
  zoomLevel: ZoomLevel;
};
export const TimelineEvent = ({
  event,
  calculateDatePosition,
  zoomLevel
}: TimelineEventProps) => {
  const {
    updateEvent,
    selectElement,
    selectedElementId
  } = useTimelineStore();
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [position, setPosition] = useState({
    x: event.x,
    y: 100
  });
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  // Update position based on date when zoom level changes
  useEffect(() => {
    const eventDate = new Date(event.date);
    const xPos = calculateDatePosition(eventDate);
    setPosition(prev => ({
      ...prev,
      x: xPos
    }));
  }, [event.date, zoomLevel, calculateDatePosition]);
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartY(e.clientY);
    selectElement(event.id);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      // Update visual position for smooth dragging
      const newPosition = {
        x: position.x + deltaX,
        y: Math.max(50, position.y + deltaY)
      };
      setPosition(newPosition);
      setStartX(e.clientX);
      setStartY(e.clientY);
      // We only update the event data (date) on mouse up to avoid excessive updates
      // This fixes the erratic movement issue
    }
  };
  const handleMouseUp = () => {
    if (isDragging) {
      // Get the current date from timeline canvas
      const canvasElement = document.getElementById('timeline-canvas');
      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        const canvasX = position.x;
        // Use the timeline's positionToDate function from the global config
        const timelineConfig = (window as any).timelineConfig;
        if (timelineConfig) {
          // Calculate the new date based on the position
          let newDate: Date;
          if (timelineConfig.positionToDate) {
            // If the timeline exposes its positionToDate function
            newDate = timelineConfig.positionToDate(canvasX);
          } else {
            // Fallback to our own calculation
            const segments = document.querySelectorAll('[data-timeline-segment]');
            let foundDate = new Date(event.date);
            // Find which segment our position is in
            segments.forEach(segment => {
              const segmentRect = segment.getBoundingClientRect();
              const segmentLeft = segmentRect.left - rect.left;
              const segmentRight = segmentRect.right - rect.left;
              if (canvasX >= segmentLeft && canvasX <= segmentRight) {
                const dateAttr = segment.getAttribute('data-date');
                if (dateAttr) {
                  foundDate = new Date(dateAttr);
                  // Adjust for position within the segment
                  const segmentWidth = segmentRight - segmentLeft;
                  const posWithinSegment = (canvasX - segmentLeft) / segmentWidth;
                  if (zoomLevel === ZoomLevel.Days) {
                    const daysToAdd = Math.floor(posWithinSegment * 30); // Approximate
                    foundDate.setDate(foundDate.getDate() + daysToAdd);
                  } else if (zoomLevel === ZoomLevel.Months) {
                    // Position within month
                    const daysToAdd = Math.floor(posWithinSegment * 30); // Approximate
                    foundDate.setDate(foundDate.getDate() + daysToAdd);
                  } else {
                    // Position within year
                    const daysToAdd = Math.floor(posWithinSegment * 365); // Approximate
                    foundDate.setDate(foundDate.getDate() + daysToAdd);
                  }
                }
              }
            });
            newDate = foundDate;
          }
          // Update the event with new position and date
          updateEvent(event.id, {
            ...event,
            x: position.x,
            date: newDate.toISOString()
          });
        }
      }
    }
    setIsDragging(false);
  };
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  const handleTitleBlur = () => {
    setIsEditing(false);
    updateEvent(event.id, {
      ...event,
      title
    });
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      updateEvent(event.id, {
        ...event,
        title
      });
    }
  };
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, position]);
  const isSelected = selectedElementId === event.id;
  return <div className={`absolute cursor-grab ${isDragging ? 'cursor-grabbing' : ''} ${isSelected ? 'z-10' : 'z-0'}`} style={{
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(-50%, 0)' // Center the event on the date point
  }} onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick}>
      <div className={`flex flex-col min-w-[150px] max-w-[250px] rounded-md shadow-md transition-shadow ${isSelected ? 'shadow-lg ring-2 ring-blue-400' : ''}`} style={{
      backgroundColor: event.color
    }}>
        <div className="px-3 py-2 bg-white rounded-t-md">
          {isEditing ? <input type="text" value={title} onChange={handleTitleChange} onBlur={handleTitleBlur} onKeyDown={handleKeyDown} className="w-full text-sm font-medium outline-none border-b border-blue-300" autoFocus /> : <h3 className="text-sm font-medium text-slate-800">
              {event.title}
            </h3>}
        </div>
        <div className="px-3 py-1.5 text-xs text-white">
          {new Date(event.date).toLocaleDateString()}
        </div>
      </div>
      <div className="absolute w-px h-20 bg-slate-300 left-1/2 bottom-full mb-1" />
      <div className="absolute w-3 h-3 rounded-full bg-white border-2 left-1/2 bottom-full mb-1 -translate-x-1/2" style={{
      borderColor: event.color
    }} />
    </div>;
};