"use client"

interface OffscreenElement {
  id: string
  title: string
  type: 'event' | 'span'
  direction: 'left' | 'right'
  distance: number
  color: string
}

interface OffscreenIndicatorsProps {
  offscreenElements: {
    left: OffscreenElement[]
    right: OffscreenElement[]
  }
  onCenterElement: (elementId: string) => void
}

export const OffscreenIndicators = ({ offscreenElements, onCenterElement }: OffscreenIndicatorsProps) => {
  return (
    <>
      {/* Left side indicators */}
      <div className="absolute inset-y-0 left-0 flex flex-col items-start justify-center pointer-events-none z-20">
        {offscreenElements.left.map((elem, index) => (
          <div
            key={`left-${elem.id}`}
            className="ml-1 my-1 w-3 h-3 rounded-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity pointer-events-auto select-none"
            style={{
              backgroundColor: elem.color,
            }}
            onClick={() => onCenterElement(elem.id)}
            title="Click to center this element"
          />
        ))}
      </div>

      {/* Right side indicators */}
      <div className="absolute inset-y-0 right-0 flex flex-col items-end justify-center pointer-events-none z-20">
        {offscreenElements.right.map((elem, index) => (
          <div
            key={`right-${elem.id}`}
            className="mr-1 my-1 w-3 h-3 rounded-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity pointer-events-auto select-none"
            style={{
              backgroundColor: elem.color,
            }}
            onClick={() => onCenterElement(elem.id)}
            title="Click to center this element"
          />
        ))}
      </div>
    </>
  )
}
