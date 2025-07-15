import { create } from 'zustand';
type TimelineEvent = {
  id: string;
  title: string;
  date: string;
  x: number;
  color: string;
};
type TimelineSpan = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  x: number;
  width: number;
  color: string;
};
type TimelineStore = {
  events: TimelineEvent[];
  spans: TimelineSpan[];
  selectedElementId: string | null;
  addEvent: (event: TimelineEvent) => void;
  updateEvent: (id: string, event: TimelineEvent) => void;
  removeEvent: (id: string) => void;
  addSpan: (span: TimelineSpan) => void;
  updateSpan: (id: string, span: TimelineSpan) => void;
  removeSpan: (id: string) => void;
  selectElement: (id: string | null) => void;
};
export const useTimelineStore = create<TimelineStore>(set => ({
  events: [{
    id: 'event-1',
    title: '📌 Project Start',
    date: new Date(2023, 0, 15).toISOString(),
    x: 150,
    color: '#3b82f6'
  }, {
    id: 'event-2',
    title: '🚀 Product Launch',
    date: new Date(2023, 5, 10).toISOString(),
    x: 500,
    color: '#ef4444'
  }],
  spans: [{
    id: 'span-1',
    title: '🟦 Development Phase',
    startDate: new Date(2023, 1, 1).toISOString(),
    endDate: new Date(2023, 3, 30).toISOString(),
    x: 300,
    width: 300,
    color: '#10b981'
  }, {
    id: 'span-2',
    title: '🟧 Testing Phase',
    startDate: new Date(2023, 4, 1).toISOString(),
    endDate: new Date(2023, 4, 30).toISOString(),
    x: 700,
    width: 150,
    color: '#f59e0b'
  }],
  selectedElementId: null,
  addEvent: event => set(state => ({
    events: [...state.events, event]
  })),
  updateEvent: (id, updatedEvent) => set(state => ({
    events: state.events.map(event => event.id === id ? updatedEvent : event)
  })),
  removeEvent: id => set(state => ({
    events: state.events.filter(event => event.id !== id)
  })),
  addSpan: span => set(state => ({
    spans: [...state.spans, span]
  })),
  updateSpan: (id, updatedSpan) => set(state => ({
    spans: state.spans.map(span => span.id === id ? updatedSpan : span)
  })),
  removeSpan: id => set(state => ({
    spans: state.spans.filter(span => span.id !== id)
  })),
  selectElement: id => set({
    selectedElementId: id
  })
}));