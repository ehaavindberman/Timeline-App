import React from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { X as XIcon, Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';
export const TimelineSidebar = ({
  onClose
}: {
  onClose: () => void;
}) => {
  const {
    events,
    spans,
    selectedElementId,
    selectElement
  } = useTimelineStore();
  const allElements = [...events.map(event => ({
    ...event,
    type: 'event',
    displayDate: new Date(event.date).toLocaleDateString()
  })), ...spans.map(span => ({
    ...span,
    type: 'span',
    displayDate: `${new Date(span.startDate).toLocaleDateString()} - ${new Date(span.endDate).toLocaleDateString()}`
  }))];
  const handleElementClick = (elementId: string) => {
    // Select the element
    selectElement(elementId);
    // Center on the element using the global function from TimelineCanvas
    const timelineConfig = (window as any).timelineConfig;
    if (timelineConfig && timelineConfig.centerOnElement) {
      timelineConfig.centerOnElement(elementId);
    }
  };
  return <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="font-medium text-slate-800">Timeline Elements</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
          <XIcon size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {allElements.map(element => <div key={element.id} onClick={() => handleElementClick(element.id)} className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${selectedElementId === element.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-100'}`}>
              <div className="flex items-center">
                {element.type === 'event' ? <CalendarIcon size={16} className="mr-2 text-slate-500" /> : <ClockIcon size={16} className="mr-2 text-slate-500" />}
                <span className="text-sm font-medium truncate">
                  {element.title}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {element.displayDate}
              </div>
              <div className="w-2 h-2 rounded-full ml-auto mt-1" style={{
            backgroundColor: element.color
          }} />
            </div>)}
          {allElements.length === 0 && <div className="text-center p-6 text-slate-500">
              <p className="text-sm">No elements yet</p>
              <p className="text-xs mt-1">
                Add events or spans from the toolbar
              </p>
            </div>}
        </div>
      </div>
    </div>;
};