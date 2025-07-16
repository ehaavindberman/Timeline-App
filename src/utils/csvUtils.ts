import type { TimelineEvent, TimelineSpan } from "../store/timelineStore"

// Helper to escape CSV values
const escapeCsvValue = (value: string | null | undefined): string => {
  if (value === null || value === undefined) {
    return ""
  }
  const stringValue = String(value)
  // If the value contains a comma, double quote, or newline, enclose it in double quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export const exportToCsv = (events: TimelineEvent[], spans: TimelineSpan[]): string => {
  const headers = ["id", "type", "title", "description", "color", "date", "startDate", "endDate", "y"]
  const rows: string[] = [headers.join(",")]

  // Add events
  events.forEach((event) => {
    rows.push(
      [
        escapeCsvValue(event.id),
        escapeCsvValue("event"),
        escapeCsvValue(event.title),
        escapeCsvValue(event.description),
        escapeCsvValue(event.color),
        escapeCsvValue(event.date),
        "", // startDate for events
        "", // endDate for events
        escapeCsvValue(event.y.toString()),
      ].join(","),
    )
  })

  // Add spans
  spans.forEach((span) => {
    rows.push(
      [
        escapeCsvValue(span.id),
        escapeCsvValue("span"),
        escapeCsvValue(span.title),
        escapeCsvValue(span.description),
        escapeCsvValue(span.color),
        "", // date for spans
        escapeCsvValue(span.startDate),
        escapeCsvValue(span.endDate),
        escapeCsvValue(span.y.toString()),
      ].join(","),
    )
  })

  return rows.join("\n")
}

// Helper to unescape CSV values
const unescapeCsvValue = (value: string): string => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.substring(1, value.length - 1).replace(/""/g, '"')
  }
  return value
}

export const importFromCsv = (csvString: string): { events: TimelineEvent[]; spans: TimelineSpan[] } => {
  const lines = csvString.split(/\r?\n/).filter((line) => line.trim() !== "")
  if (lines.length <= 1) {
    return { events: [], spans: [] }
  }

  const headers = lines[0].split(",").map((h) => unescapeCsvValue(h.trim()))
  const dataLines = lines.slice(1)

  const events: TimelineEvent[] = []
  const spans: TimelineSpan[] = []

  dataLines.forEach((line, index) => {
    try {
      // Simple split by comma, but need to handle quoted commas
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map((v) => unescapeCsvValue(v.trim())) || []

      if (values.length < headers.length) {
        console.warn(`Skipping malformed CSV row ${index + 2}:`, line)
        return
      }

      const rowData: { [key: string]: string } = {}
      headers.forEach((header, index) => {
        rowData[header] = values[index] || ""
      })

      const type = rowData.type
      const id = rowData.id || `imported-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const title = rowData.title || "Untitled"
      const description = rowData.description || ""
      const color = rowData.color || "#6b7280"
      const y = Number.parseInt(rowData.y) || (type === "event" ? 100 : 200) // Default y positions

      if (type === "event") {
        const date = rowData.date
        if (date && !isNaN(new Date(date).getTime())) {
          events.push({
            id,
            title,
            description,
            date,
            x: 0, // Will be recalculated by TimelineCanvas
            y,
            color,
          })
        } else {
          console.warn(`Skipping event with invalid date on row ${index + 2}:`, rowData)
        }
      } else if (type === "span") {
        const startDate = rowData.startDate
        const endDate = rowData.endDate
        if (startDate && endDate && !isNaN(new Date(startDate).getTime()) && !isNaN(new Date(endDate).getTime())) {
          spans.push({
            id,
            title,
            description,
            startDate,
            endDate,
            x: 0, // Will be recalculated by TimelineCanvas
            y,
            width: 0, // Will be recalculated by TimelineCanvas
            color,
          })
        } else {
          console.warn(`Skipping span with invalid dates on row ${index + 2}:`, rowData)
        }
      } else {
        console.warn(`Skipping unknown element type on row ${index + 2}:`, rowData)
      }
    } catch (error) {
      console.error(`Error processing row ${index + 2}:`, error)
    }
  })

  return { events, spans }
}
