import React, { useEffect, useState } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { ZoomLevel } from './TimelineCanvas';
type TimelineSpanProps = {
  span: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    x: number;
    width: number;
    color: string;
  };
  calculateDatePosition: (date: Date) => number;
  zoomLevel: ZoomLevel;
};
export const TimelineSpan = ({
  span,
  calculateDatePosition,
  zoomLevel
}: TimelineSpanProps) => {
  const {
    updateSpan,
    selectElement,
    selectedElementId
  } = useTimelineStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'left' | 'right' | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(span.width);
  const [startPosition, setStartPosition] = useState(span.x);
  const [position, setPosition] = useState({
    x: span.x,
    y: 200
  });
  const [width, setWidth] = useState(span.width);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(span.title);
  // Update position and width based on dates when zoom level changes
  useEffect(() => {
    const startDate = new Date(span.startDate);
    const endDate = new Date(span.endDate);
    const xPos = calculateDatePosition(startDate);
    const endPos = calculateDatePosition(endDate);
    const newWidth = endPos - xPos;
    setPosition(prev => ({
      ...prev,
      x: xPos
    }));
    setWidth(newWidth > 0 ? newWidth : 100); // Ensure minimum width
  }, [span.startDate, span.endDate, zoomLevel, calculateDatePosition]);
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setStartX(e.clientX);
    selectElement(span.id);
  };
  const handleResizeStart = (e: React.MouseEvent, direction: 'left' | 'right') => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setStartX(e.clientX);
    setStartWidth(width);
    setStartPosition(position.x);
    selectElement(span.id);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - startX;
      // Update visual position for smooth dragging
      const newPosition = {
        x: position.x + deltaX,
        y: position.y
      };
      setPosition(newPosition);
      setStartX(e.clientX);
      // We only update the span data (dates) on mouse up to avoid excessive updates
      // This fixes the erratic movement issue
    }
    if (isResizing) {
      const deltaX = e.clientX - startX;
      if (resizeDirection === 'right') {
        // Calculate new width - just visual update
        const newWidth = Math.max(100, startWidth + deltaX);
        setWidth(newWidth);
      } else if (resizeDirection === 'left') {
        // Calculate new width and position - just visual update
        const newWidth = Math.max(100, startWidth - deltaX);
        const newX = startPosition + startWidth - newWidth;
        setWidth(newWidth);
        setPosition({
          x: newX,
          y: position.y
        });
      }
    }
  };
  const handleMouseUp = () => {
    // When releasing the mouse, we need to update the actual data
    if (isDragging || isResizing) {
      // Get the current date from timeline canvas
      const canvasElement = document.getElementById('timeline-canvas');
      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        const canvasX = position.x;
        const canvasEndX = position.x + width;
        // Use the timeline's functions from the global config
        const timelineConfig = (window as any).timelineConfig;
        if (timelineConfig) {
          // Calculate the new dates based on the position and width
          let newStartDate = new Date(span.startDate);
          let newEndDate = new Date(span.endDate);
          // Try to use the canvas's positionToDate function
          if (isDragging) {
            // When dragging, we want to preserve the duration
            const duration = new Date(span.endDate).getTime() - new Date(span.startDate).getTime();
            // Calculate new start date based on new position
            newStartDate = new Date(calculatePositionDate(canvasX));
            // Calculate new end date by adding the original duration
            newEndDate = new Date(newStartDate.getTime() + duration);
          } else if (isResizing) {
            if (resizeDirection === 'right') {
              // Only the end date changes
              newEndDate = new Date(calculatePositionDate(canvasEndX));
            } else if (resizeDirection === 'left') {
              // Only the start date changes
              newStartDate = new Date(calculatePositionDate(canvasX));
            }
          }
          // Update the span with new position, width, and dates
          updateSpan(span.id, {
            ...span,
            x: position.x,
            width: width,
            startDate: newStartDate.toISOString(),
            endDate: newEndDate.toISOString()
          });
        }
      }
    }
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
  };
  // Helper function to calculate date from position
  const calculatePositionDate = (posX: number): Date => {
    // Use the canvas's calculateDatePosition in reverse if available
    const timelineConfig = (window as any).timelineConfig;
    if (timelineConfig && timelineConfig.positionToDate) {
      return timelineConfig.positionToDate(posX);
    }
    // Fallback implementation
    const segments = document.querySelectorAll('[data-timeline-segment]');
    let foundDate = new Date();
    // Find which segment our position is in
    segments.forEach(segment => {
      const segmentRect = segment.getBoundingClientRect();
      const canvasElement = document.getElementById('timeline-canvas');
      if (!canvasElement) return;
      const rect = canvasElement.getBoundingClientRect();
      const segmentLeft = segmentRect.left - rect.left;
      const segmentRight = segmentRect.right - rect.left;
      if (posX >= segmentLeft && posX <= segmentRight) {
        const dateAttr = segment.getAttribute('data-date');
        if (dateAttr) {
          foundDate = new Date(dateAttr);
          // Adjust for position within the segment
          const segmentWidth = segmentRight - segmentLeft;
          const posWithinSegment = (posX - segmentLeft) / segmentWidth;
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
    return foundDate;
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
    updateSpan(span.id, {
      ...span,
      title
    });
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      updateSpan(span.id, {
        ...span,
        title
      });
    }
  };
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, position, width]);
  const isSelected = selectedElementId === span.id;
  return <div className={`absolute ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${isSelected ? 'z-10' : 'z-0'}`} style={{
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${width}px`
  }} onMouseDown={handleMouseDown} onDoubleClick={handleDoubleClick}>
      <div className={`rounded-md transition-shadow ${isSelected ? 'shadow-lg ring-2 ring-blue-400' : 'shadow-md'}`} style={{
      backgroundColor: span.color,
      opacity: 0.9
    }}>
        <div className="px-3 py-2 bg-white rounded-t-md">
          {isEditing ? <input type="text" value={title} onChange={handleTitleChange} onBlur={handleTitleBlur} onKeyDown={handleKeyDown} className="w-full text-sm font-medium outline-none border-b border-blue-300" autoFocus /> : <h3 className="text-sm font-medium text-slate-800">{span.title}</h3>}
        </div>
        <div className="px-3 py-2 text-xs text-white flex justify-between">
          <span>{new Date(span.startDate).toLocaleDateString()}</span>
          <span>to</span>
          <span>{new Date(span.endDate).toLocaleDateString()}</span>
        </div>
      </div>
      {/* Resize handles */}
      <div className="absolute left-0 top-0 w-2 h-full cursor-ew-resize" onMouseDown={e => handleResizeStart(e, 'left')} />
      <div className="absolute right-0 top-0 w-2 h-full cursor-ew-resize" onMouseDown={e => handleResizeStart(e, 'right')} />
    </div>;
};