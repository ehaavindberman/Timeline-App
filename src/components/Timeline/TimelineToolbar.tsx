import React from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { TIMELINE_START } from './TimelineCanvas';
import { PlusIcon, CalendarIcon, ArrowRightIcon, LayoutIcon, ImageIcon, SlidersIcon, MenuIcon } from 'lucide-react';
export const TimelineToolbar = ({
  onOpenSidebar
}: {
  onOpenSidebar: () => void;
}) => {
  const {
    addEvent,
    addSpan
  } = useTimelineStore();
  // Get scale from window if available (set in TimelineCanvas)
  const getScale = () => {
    return (window as any)?.timelineConfig?.scale || 100;
  };
  // Convert date to position
  const dateToPosition = (date: Date): number => {
    const diffTime = date.getTime() - TIMELINE_START.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * getScale();
  };
  const handleAddEvent = () => {
    const today = new Date();
    const xPos = dateToPosition(today);
    addEvent({
      id: `event-${Date.now()}`,
      title: `📌 New Event`,
      date: today.toISOString(),
      x: xPos,
      color: '#3b82f6'
    });
  };
  const handleAddSpan = () => {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 7);
    const xPos = dateToPosition(today);
    const width = 7 * getScale(); // 7 days width
    addSpan({
      id: `span-${Date.now()}`,
      title: `🟦 New Time Span`,
      startDate: today.toISOString(),
      endDate: endDate.toISOString(),
      x: xPos,
      width: width,
      color: '#10b981'
    });
  };
  return <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200">
      <div className="flex items-center space-x-1">
        <button onClick={onOpenSidebar} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <MenuIcon size={18} />
        </button>
        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        <button onClick={handleAddEvent} className="flex items-center space-x-1 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 rounded-md">
          <CalendarIcon size={16} />
          <span>Event</span>
        </button>
        <button onClick={handleAddSpan} className="flex items-center space-x-1 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 rounded-md">
          <ArrowRightIcon size={16} />
          <span>Span</span>
        </button>
        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <LayoutIcon size={16} />
        </button>
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <ImageIcon size={16} />
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
          <SlidersIcon size={16} />
        </button>
      </div>
    </div>;
};