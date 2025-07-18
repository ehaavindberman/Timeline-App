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

type TimelineState = {
  events: TimelineEvent[]
  spans: TimelineSpan[]
  selectedElementId: string | null
}

type HistoryEntry = {
  state: TimelineState
  action: string
  timestamp: number
}

type TimelineStore = {
  events: TimelineEvent[]
  spans: TimelineSpan[]
  selectedElementId: string | null
  history: HistoryEntry[]
  historyIndex: number
  maxHistorySize: number
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
  // Undo/Redo actions
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  // Internal history management
  saveToHistory: (action: string) => void
}

const initialEvents: TimelineEvent[] = [
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
]

const initialSpans: TimelineSpan[] = [
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
]

export const useTimelineStore = create<TimelineStore>((set, get) => {
  // Helper function to create a deep copy of the current state
  const getCurrentState = (): TimelineState => {
    const { events, spans, selectedElementId } = get()
    return {
      events: JSON.parse(JSON.stringify(events)),
      spans: JSON.parse(JSON.stringify(spans)),
      selectedElementId,
    }
  }

  // Helper function to save current state to history
  const saveToHistory = (action: string) => {
    const currentState = getCurrentState()
    const { history, historyIndex, maxHistorySize } = get()

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1)

    // Add new entry
    newHistory.push({
      state: currentState,
      action,
      timestamp: Date.now(),
    })

    // Limit history size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift()
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  }

  // Initialize with current state in history
  const initialState: TimelineState = {
    events: initialEvents,
    spans: initialSpans,
    selectedElementId: null,
  }

  return {
    events: initialEvents,
    spans: initialSpans,
    selectedElementId: null,
    history: [
      {
        state: initialState,
        action: "Initial state",
        timestamp: Date.now(),
      },
    ],
    historyIndex: 0,
    maxHistorySize: 50,

    addEvent: (event) => {
      saveToHistory("Add event")
      set((state) => ({
        events: [...state.events, event],
      }))
    },

    updateEvent: (id, updatedEvent) => {
      const { events } = get()
      const existingEvent = events.find((e) => e.id === id)

      // Only save to history if there's an actual change
      if (existingEvent && JSON.stringify(existingEvent) !== JSON.stringify(updatedEvent)) {
        saveToHistory("Update event")
      }

      set((state) => ({
        events: state.events.map((event) => (event.id === id ? updatedEvent : event)),
      }))
    },

    removeEvent: (id) => {
      saveToHistory("Remove event")
      set((state) => ({
        events: state.events.filter((event) => event.id !== id),
      }))
    },

    addSpan: (span) => {
      saveToHistory("Add span")
      set((state) => ({
        spans: [...state.spans, span],
      }))
    },

    updateSpan: (id, updatedSpan) => {
      const { spans } = get()
      const existingSpan = spans.find((s) => s.id === id)

      // Only save to history if there's an actual change
      if (existingSpan && JSON.stringify(existingSpan) !== JSON.stringify(updatedSpan)) {
        saveToHistory("Update span")
      }

      set((state) => ({
        spans: state.spans.map((span) => (span.id === id ? updatedSpan : span)),
      }))
    },

    removeSpan: (id) => {
      saveToHistory("Remove span")
      set((state) => ({
        spans: state.spans.filter((span) => span.id !== id),
      }))
    },

    selectElement: (id) =>
      set({
        selectedElementId: id,
      }),

    setEvents: (events) => {
      saveToHistory("Import events")
      set({
        events,
      })
    },

    setSpans: (spans) => {
      saveToHistory("Import spans")
      set({
        spans,
      })
    },

    undo: () => {
      const { history, historyIndex } = get()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        const previousState = history[newIndex].state

        set({
          events: previousState.events,
          spans: previousState.spans,
          selectedElementId: previousState.selectedElementId,
          historyIndex: newIndex,
        })
      }
    },

    redo: () => {
      const { history, historyIndex } = get()
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1
        const nextState = history[newIndex].state

        set({
          events: nextState.events,
          spans: nextState.spans,
          selectedElementId: nextState.selectedElementId,
          historyIndex: newIndex,
        })
      }
    },

    canUndo: () => {
      const { historyIndex } = get()
      return historyIndex > 0
    },

    canRedo: () => {
      const { history, historyIndex } = get()
      return historyIndex < history.length - 1
    },

    saveToHistory,
  }
})

export type { TimelineEvent, TimelineSpan }
