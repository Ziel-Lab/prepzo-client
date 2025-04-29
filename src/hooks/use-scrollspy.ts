import * as React from 'react'

export function useScrollSpy(
  selectors: string[],
  options?: IntersectionObserverInit
) {
  const [activeId, setActiveId] = React.useState<string | null>()
  const observer = React.useRef<IntersectionObserver | null>(null)
  
  React.useEffect(() => {
    const elements = selectors.map((selector) =>
      document.querySelector(selector)
    )
    
    // Store intersection data for all elements
    const visibleElements = new Map<string, number>()
    
    observer.current?.disconnect()
    observer.current = new IntersectionObserver((entries) => {
      // Update visibility data for entries
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('id')
        if (id) {
          if (entry.isIntersecting) {
            visibleElements.set(id, entry.intersectionRatio)
          } else {
            visibleElements.delete(id)
          }
        }
      })
      
      // Find the most visible element
      let maxRatio = 0
      let mostVisibleId: string | null = null
      
      visibleElements.forEach((ratio, id) => {
        if (ratio > maxRatio) {
          maxRatio = ratio
          mostVisibleId = id
        }
      })
      
      // Only update if we have a visible element
      if (mostVisibleId) {
        setActiveId(mostVisibleId)
      } else if (visibleElements.size === 0) {
        // If no elements are visible, clear active state
        setActiveId(null)
      }
    }, { threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0], ...options })
    
    elements.forEach((el) => {
      if (el) observer.current?.observe(el)
    })
    
    return () => observer.current?.disconnect()
  }, [selectors, options])

  return activeId
}
