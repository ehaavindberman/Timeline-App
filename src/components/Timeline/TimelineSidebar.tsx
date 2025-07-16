"use client"

import { useState, useEffect } from "react"
import { useTimelineStore } from "../../store/timelineStore"
import { XIcon, CalendarIcon, ClockIcon, Trash2Icon } from "lucide-react"

export const TimelineSidebar = ({
  onClose,
}: {
  onClose: () => void
}) => {
  const { events, spans, selectedElementId, selectElement, updateEvent, updateSpan, removeEvent, removeSpan } =
    useTimelineStore()

  const [editingTitle, setEditingTitle] = useState("")
  const [editingDescription, setEditingDescription] = useState("")
  const [editingColor, setEditingColor] = useState("")
  const [editingDate, setEditingDate] = useState("")
  const [editingStartDate, setEditingStartDate] = useState("")
  const [editingEndDate, setEditingEndDate] = useState("")

  const selectedElement = selectedElementId ? [...events, ...spans].find((el) => el.id === selectedElementId) : null

  const selectedEvent = selectedElementId ? events.find((e) => e.id === selectedElementId) : null

  const selectedSpan = selectedElementId ? spans.find((s) => s.id === selectedElementId) : null

  // Update editing fields when selection changes
  useEffect(() => {
    if (selectedElement) {
      setEditingTitle(selectedElement.title)
      setEditingDescription(selectedElement.description || "")
      setEditingColor(selectedElement.color)

      if (selectedEvent) {
        setEditingDate(new Date(selectedEvent.date).toISOString().split("T")[0])
      } else if (selectedSpan) {
        setEditingStartDate(new Date(selectedSpan.startDate).toISOString().split("T")[0])
        setEditingEndDate(new Date(selectedSpan.endDate).toISOString().split("T")[0])
      }
    }
  }, [selectedElement, selectedEvent, selectedSpan])

  const allElements = [
    ...events.map((event) => ({
      ...event,
      type: "event",
      displayDate: new Date(event.date).toLocaleDateString(),
    })),
    ...spans.map((span) => ({
      ...span,
      type: "span",
      displayDate: `${new Date(span.startDate).toLocaleDateString()} - ${new Date(span.endDate).toLocaleDateString()}`,
    })),
  ]

  const handleElementClick = (elementId: string) => {
    selectElement(elementId)
    const timelineConfig = (window as any).timelineConfig
    if (timelineConfig && timelineConfig.centerOnElement) {
      timelineConfig.centerOnElement(elementId)
    }
  }

  const handleTitleChange = (value: string) => {
    setEditingTitle(value)
    if (selectedEvent) {
      updateEvent(selectedElementId!, {
        ...selectedEvent,
        title: value,
      })
    } else if (selectedSpan) {
      updateSpan(selectedElementId!, {
        ...selectedSpan,
        title: value,
      })
    }
  }

  const handleDescriptionChange = (value: string) => {
    setEditingDescription(value)
    if (selectedEvent) {
      updateEvent(selectedElementId!, {
        ...selectedEvent,
        description: value,
      })
    } else if (selectedSpan) {
      updateSpan(selectedElementId!, {
        ...selectedSpan,
        description: value,
      })
    }
  }

  const handleColorChange = (value: string) => {
    setEditingColor(value)
    if (selectedEvent) {
      updateEvent(selectedElementId!, {
        ...selectedEvent,
        color: value,
      })
    } else if (selectedSpan) {
      updateSpan(selectedElementId!, {
        ...selectedSpan,
        color: value,
      })
    }
  }

  const handleDateChange = (value: string) => {
    setEditingDate(value)
    if (selectedEvent) {
      const newDate = new Date(value)
      updateEvent(selectedElementId!, {
        ...selectedEvent,
        date: newDate.toISOString(),
      })
    }
  }

  const handleStartDateChange = (value: string) => {
    setEditingStartDate(value)
    if (selectedSpan) {
      const newStartDate = new Date(value)
      updateSpan(selectedElementId!, {
        ...selectedSpan,
        startDate: newStartDate.toISOString(),
      })
    }
  }

  const handleEndDateChange = (value: string) => {
    setEditingEndDate(value)
    if (selectedSpan) {
      const newEndDate = new Date(value)
      updateSpan(selectedElementId!, {
        ...selectedSpan,
        endDate: newEndDate.toISOString(),
      })
    }
  }

  const handleDelete = () => {
    if (selectedElementId) {
      if (selectedEvent) {
        removeEvent(selectedElementId)
      } else if (selectedSpan) {
        removeSpan(selectedElementId)
      }
      selectElement(null)
    }
  }

  const colorOptions = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // yellow
    "#8b5cf6", // purple
    "#f97316", // orange
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#ec4899", // pink
    "#6b7280", // gray
  ]

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="font-medium text-slate-800">Timeline Elements</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
          <XIcon size={18} />
        </button>
      </div>

      {/* Element List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="space-y-1">
            {allElements.map((element) => (
              <div
                key={element.id}
                onClick={() => handleElementClick(element.id)}
                className={`px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  selectedElementId === element.id
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    {element.type === "event" ? (
                      <CalendarIcon size={16} className="mr-2 text-slate-500 flex-shrink-0" />
                    ) : (
                      <ClockIcon size={16} className="mr-2 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate">{element.title}</span>
                  </div>
                  <div className="w-3 h-3 rounded-full flex-shrink-0 ml-2" style={{ backgroundColor: element.color }} />
                </div>
                <div className="text-xs text-slate-500 mt-1 ml-6">{element.displayDate}</div>
                {element.description && (
                  <div className="text-xs text-slate-400 mt-1 ml-6 line-clamp-2">{element.description}</div>
                )}
              </div>
            ))}
            {allElements.length === 0 && (
              <div className="text-center p-6 text-slate-500">
                <p className="text-sm">No elements yet</p>
                <p className="text-xs mt-1">Add events or spans from the toolbar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Panel */}
      {selectedElement && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-800">Edit {selectedEvent ? "Event" : "Span"}</h3>
            <button
              onClick={handleDelete}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2Icon size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={editingDescription}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Add a description..."
                rows={3}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Color</label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={`w-8 h-8 rounded border-2 ${
                      editingColor === color ? "border-slate-400" : "border-slate-200"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Date(s) */}
            {selectedEvent ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editingDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editingStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editingEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
