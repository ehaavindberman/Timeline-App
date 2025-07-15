import React, { useState } from 'react';
import { TimelineCanvas } from './components/Timeline/TimelineCanvas';
import { TimelineToolbar } from './components/Timeline/TimelineToolbar';
import { TimelineSidebar } from './components/Timeline/TimelineSidebar';
export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return <div className="flex flex-col w-full h-screen bg-slate-50 overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-medium text-slate-800">
            Timeline Builder
          </h1>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
            Beta
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Share
          </button>
          <button className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-100 transition-colors">
            Export
          </button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <TimelineSidebar onClose={() => setSidebarOpen(false)} />}
        <div className="flex flex-col flex-1 overflow-hidden">
          <TimelineToolbar onOpenSidebar={() => setSidebarOpen(true)} />
          <TimelineCanvas />
        </div>
      </div>
    </div>;
}