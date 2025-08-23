"use client";

import type React from "react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useTimelineStore } from "../../store/timelineStore";
import { TimelineEvent } from "./TimelineEvent";
import { TimelineSpan } from "./TimelineSpan";

import { TimelineControls } from "./TimelineControls";
import { OffscreenIndicators } from "./OffscreenIndicators";
import { centerOnElement as centerOnElementUtil } from "../../utils/timelineUtils";
import { TimelineRuler } from "./TimelineRuler";
import { TimelineRulerIndicators } from "./TimelineRulerIndicators";
import { TimelineGuidelines } from "./TimelineGuidelines";
import { useOffscreenElements } from "../../hooks/useOffscreenElements";
import {
  positionToDate as positionToDateUtil,
  calculateDatePosition as calculateDatePositionUtil,
  REFERENCE_DATE,
} from "../../utils/timelineCalculations";
import { getVisibleDateRange } from "../../utils/timelineViewport";

// Default center date for initial view
const DEFAULT_CENTER_DATE = new Date(2023, 4, 12); // April 12, 2023

export const TimelineCanvas = () => {
  const { events, spans, addEvent, selectElement } = useTimelineStore();
  const [scale, setScale] = useState(5); // Start at year level (5 pixels per day)
  const [position, setPosition] = useState(0); // horizontal scroll position
  const [isDragging, setIsDragging] = useState(false);
  const [startDragX, setStartDragX] = useState(0);
  const [startPosition, setStartPosition] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false); // Track if initial positioning is done

  const canvasRef = useRef<HTMLDivElement>(null);

  // Convert position to date based on reference date
  const positionToDate = useCallback(
    (xPos: number): Date => {
      return positionToDateUtil(xPos, scale);
    },
    [scale],
  );

  // Calculate the visible date range based on current position and canvas width
  const getVisibleDateRangeCallback = useCallback(() => {
    const canvasWidth = canvasRef.current?.clientWidth || 1200;
    return getVisibleDateRange(position, canvasWidth, scale);
  }, [position, scale]);

  // Get current visible date range using the utility function
  const { startDate, endDate } = getVisibleDateRangeCallback();

  // Calculate date position based on reference date
  const calculateDatePosition = useCallback(
    (date: Date): number => {
      return calculateDatePositionUtil(date, scale);
    },
    [scale],
  );

  // Initialize the timeline position to center on DEFAULT_CENTER_DATE
  useEffect(() => {
    if (canvasRef.current && !isInitialized) {
      const canvasWidth = canvasRef.current.clientWidth;
      const centerX = canvasWidth / 2;

      // Calculate position of DEFAULT_CENTER_DATE
      const centerDatePosition = calculateDatePosition(DEFAULT_CENTER_DATE);

      // Set position to center the default date
      const initialPosition = centerX - centerDatePosition;
      setPosition(initialPosition);
      setIsInitialized(true);

      console.log("🎯 Initial Positioning:", {
        canvasWidth,
        centerX,
        defaultCenterDate: DEFAULT_CENTER_DATE.toISOString(),
        centerDatePosition: Math.round(centerDatePosition),
        initialPosition: Math.round(initialPosition),
        verification: "Center should be at DEFAULT_CENTER_DATE",
      });
    }
  }, [calculateDatePosition, isInitialized]);

  // Snap x position to nearest day based on scale
  const snapToGrid = useCallback(
    (xPos: number): number => {
      return Math.round(xPos / scale) * scale;
    },
    [scale],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    setStartDragX(e.clientX);
    setStartPosition(position);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - startDragX;
      const newPosition = startPosition + deltaX;
      setPosition(newPosition); // No bounds checking for infinite scroll
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get current viewport center
  const getCurrentViewportCenter = useCallback(() => {
    if (canvasRef.current) {
      const canvasWidth = canvasRef.current.clientWidth;
      const centerX = canvasWidth / 2;

      // Calculate the absolute timeline position at the center of the viewport
      const absoluteXAtCenter = -position + centerX;

      // Convert to date
      const centerDate = positionToDate(absoluteXAtCenter);

      return {
        date: centerDate,
        x: absoluteXAtCenter,
      };
    }

    // Fallback
    return {
      date: new Date(),
      x: 0,
    };
  }, [position, positionToDate]);

  // Handle double click to add event
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = e.clientX - rect.left - position;
      const x = snapToGrid(rawX); // Snap to grid
      const date = positionToDate(x);
      addEvent({
        id: `event-${Date.now()}`,
        title: `🌿 New Nature Event`,
        description: "A significant moment in the natural world.",
        date: date.toISOString(),
        x: x,
        y: 100, // Default y position
        color: "#10b981",
      });
    }
  };

  const handleZoom = (factor: number) => {
    if (canvasRef.current) {
      const currentCanvasWidth = canvasRef.current.clientWidth;
      const centerX = currentCanvasWidth / 2;

      // 1. Calculate the absolute pixel position under the current canvas center
      const absoluteXAtCurrentCenter = -position + centerX;

      // 2. Convert this absolute pixel position to a date BEFORE zooming
      const dateUnderCenter = positionToDate(absoluteXAtCurrentCenter);

      // 3. Determine the new scale
      const targetScale = scale * factor;
      const newScale = Math.max(1, Math.min(1000, targetScale)); // Increased max scale for infinite scroll

      // 4. Update scale
      setScale(newScale);

      // 5. Calculate the absolute X position of `dateUnderCenter` with the new scale
      const diffTime = dateUnderCenter.getTime() - REFERENCE_DATE.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      // Simplified: scale is always pixels per day
      const absoluteXForCenteredDateAtNewScale = diffDays * newScale;

      // 6. Calculate the new scroll position to keep `dateUnderCenter` at `centerX`
      const newPosition = centerX - absoluteXForCenteredDateAtNewScale;

      // 7. Apply the new position
      setPosition(newPosition);
    }
  };

  // Zoom preset methods
  const setPresetZoom = useCallback(
    (level: "day" | "month" | "year") => {
      if (canvasRef.current) {
        const currentCanvasWidth = canvasRef.current.clientWidth;
        const centerX = currentCanvasWidth / 2;

        // Get the date currently at the center
        const absoluteXAtCurrentCenter = -position + centerX;
        const dateUnderCenter = positionToDate(absoluteXAtCurrentCenter);

        // Set the appropriate scale for each zoom level
        let newScale: number;

        switch (level) {
          case "day":
            newScale = 100; // High scale for day view
            break;
          case "month":
            newScale = 20; // Medium scale for month view
            break;
          case "year":
            newScale = 5; // Low scale for year view
            break;
          default:
            return;
        }

        // Update scale
        setScale(newScale);

        // Calculate new position to keep the same date centered
        const diffTime = dateUnderCenter.getTime() - REFERENCE_DATE.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        // Simplified: scale is always pixels per day
        const absoluteXForCenteredDateAtNewScale = diffDays * newScale;

        const newPosition = centerX - absoluteXForCenteredDateAtNewScale;
        setPosition(newPosition);
      }
    },
    [position, positionToDate],
  );

  // Expose timeline methods globally for toolbar access
  useEffect(() => {
    (window as any).timelineConfig = {
      setPresetZoom,
      getCurrentViewportCenter,
      calculateDatePosition,
    };

    return () => {
      delete (window as any).timelineConfig;
    };
  }, [setPresetZoom, getCurrentViewportCenter, calculateDatePosition]);

  // Center on a specific element by ID
  const centerOnElement = useCallback(
    (elementId: string) => {
      if (canvasRef.current) {
        const canvasWidth = canvasRef.current.clientWidth;
        centerOnElementUtil(
          elementId,
          events,
          spans,
          calculateDatePosition,
          setPosition,
          selectElement,
          canvasWidth,
        );
      }
    },
    [events, spans, calculateDatePosition, selectElement],
  );

  // Add to global window so other components can access it
  useEffect(() => {
    (window as any).timelineConfig = {
      scale,
      referenceDate: REFERENCE_DATE,
      positionToDate: positionToDate,
      calculateDatePosition: calculateDatePosition,
      centerOnElement,
      setPresetZoom,
      getCurrentViewportCenter,
    };
  }, [
    scale,
    positionToDate,
    calculateDatePosition,
    centerOnElement,
    setPresetZoom,
    getCurrentViewportCenter,
  ]);

  // Calculate off-screen elements using custom hook
  const offscreenElements = useOffscreenElements({
    events,
    spans,
    position,
    canvasWidth: canvasRef.current?.clientWidth || 1200,
    calculateDatePosition,
    scale,
  });

  // Render the appropriate timeline ruler based on zoom level

  return (
    <div className="relative flex-1 overflow-hidden bg-white select-none">
      <TimelineControls
        onZoomIn={() => handleZoom(1.25)}
        onZoomOut={() => handleZoom(0.8)}
        onScrollLeft={() => setPosition(position + 500)}
        onScrollRight={() => setPosition(position - 500)}
      />
      <OffscreenIndicators
        offscreenElements={offscreenElements}
        onCenterElement={centerOnElement}
      />
      <div
        id="timeline-canvas"
        ref={canvasRef}
        className="h-full w-full overflow-hidden cursor-grab select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div
          className="relative h-full select-none"
          style={{
            width: "100%",
            transform: `translateX(${position}px)`,
            transition: isDragging
              ? "none"
              : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Timeline ruler */}
          <div className="sticky top-0 z-10 h-16 bg-white border-b border-slate-200 select-none">
            <TimelineRuler scale={scale} position={position} />
          </div>
          {/* Timeline ruler indicators */}
          <TimelineRulerIndicators
            events={events}
            spans={spans}
            calculateDatePosition={calculateDatePosition}
            position={position}
            canvasWidth={canvasRef.current?.clientWidth || 1200}
          />
          {/* Timeline content */}
          <div className="relative h-[calc(100%-4rem)] pt-8 select-none">
            {/* Guidelines - will be added back with scale-based logic later */}
            <TimelineGuidelines
              scale={scale}
              startDate={startDate}
              endDate={endDate}
            />

            {/* Time spans (z-index 20, selected: 30) */}
            {spans.map((span) => (
              <TimelineSpan
                key={span.id}
                span={span}
                calculateDatePosition={calculateDatePosition}
              />
            ))}
            {/* Events (z-index 20, selected: 30) */}
            {events.map((event) => (
              <TimelineEvent
                key={event.id}
                event={event}
                calculateDatePosition={calculateDatePosition}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
