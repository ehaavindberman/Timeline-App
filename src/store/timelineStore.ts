import { create } from "zustand"

type TimelineEvent = {
  id: string
  title: string
  description: string
  date: string
  x: number
  y: number // Add y position for vertical placement
  color: string
}

type TimelineSpan = {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  x: number
  y: number // Add y position for vertical placement
  width: number
  color: string
}

type TimelineStore = {
  events: TimelineEvent[]
  spans: TimelineSpan[]
  selectedElementId: string | null
  addEvent: (event: TimelineEvent) => void
  updateEvent: (id: string, event: TimelineEvent) => void
  removeEvent: (id: string) => void
  addSpan: (span: TimelineSpan) => void
  updateSpan: (id: string, span: TimelineSpan) => void
  removeSpan: (id: string) => void
  selectElement: (id: string | null) => void
  // New actions for import
  setEvents: (events: TimelineEvent[]) => void
  setSpans: (spans: TimelineSpan[]) => void
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  events: [
    {
      id: "event-1",
      title: "🌸 Cherry Blossom Peak",
      description:
        "The cherry trees reach full bloom, creating a spectacular pink canopy across the valley. This marks the traditional start of spring celebrations.",
      date: new Date(2023, 3, 15).toISOString(), // April 15
      x: 150,
      y: 100,
      color: "#ec4899", // pink
    },
    {
      id: "event-2",
      title: "🦋 Monarch Migration",
      description:
        "Millions of monarch butterflies begin their incredible journey south, traveling over 2,000 miles to their wintering grounds in Mexico.",
      date: new Date(2023, 8, 10).toISOString(), // September 10
      x: 500,
      y: 150,
      color: "#f59e0b", // orange
    },
    {
      id: "event-3",
      title: "❄️ First Snowfall",
      description:
        "The season's first snow blankets the forest in pristine white, transforming the landscape into a winter wonderland.",
      date: new Date(2023, 11, 5).toISOString(), // December 5
      x: 700,
      y: 200,
      color: "#06b6d4", // cyan
    },
  ],
  spans: [
    {
      id: "span-1",
      title: "🌱 Spring Growing Season",
      description:
        "The period when most plants emerge from winter dormancy and begin active growth. Temperatures warm, daylight increases, and new life flourishes throughout the ecosystem.",
      startDate: new Date(2023, 2, 20).toISOString(), // March 20
      endDate: new Date(2023, 5, 20).toISOString(), // June 20
      x: 300,
      y: 250,
      width: 300,
      color: "#10b981", // green
    },
    {
      id: "span-2",
      title: "🍂 Autumn Leaf Season",
      description:
        "Trees prepare for winter by withdrawing chlorophyll from their leaves, revealing brilliant reds, oranges, and yellows. A spectacular natural display before winter's arrival.",
      startDate: new Date(2023, 8, 15).toISOString(), // September 15
      endDate: new Date(2023, 10, 15).toISOString(), // November 15
      x: 700,
      y: 300,
      width: 200,
      color: "#f97316", // orange
    },
  ],
  selectedElementId: null,
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
    })),
  updateEvent: (id, updatedEvent) =>
    set((state) => ({
      events: state.events.map((event) => (event.id === id ? updatedEvent : event)),
    })),
  removeEvent: (id) =>
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    })),
  addSpan: (span) =>
    set((state) => ({
      spans: [...state.spans, span],
    })),
  updateSpan: (id, updatedSpan) =>
    set((state) => ({
      spans: state.spans.map((span) => (span.id === id ? updatedSpan : span)),
    })),
  removeSpan: (id) =>
    set((state) => ({
      spans: state.spans.filter((span) => span.id !== id),
    })),
  selectElement: (id) =>
    set({
      selectedElementId: id,
    }),
  setEvents: (events) =>
    set({
      events,
    }),
  setSpans: (spans) =>
    set({
      spans,
    }),
}))

export type { TimelineEvent, TimelineSpan }
