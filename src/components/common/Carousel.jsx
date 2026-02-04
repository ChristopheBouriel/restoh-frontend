import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const Carousel = ({
  children,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 4 },
  autoPlay = false,
  autoPlayInterval = 5000,
  showArrows = true,
  showDots = true,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visibleItems, setVisibleItems] = useState(itemsPerView.desktop)
  const items = Array.isArray(children) ? children : [children]
  const totalItems = items.length

  // Update visible items based on screen size
  useEffect(() => {
    const updateVisibleItems = () => {
      if (window.innerWidth < 768) {
        setVisibleItems(itemsPerView.mobile)
      } else if (window.innerWidth < 1024) {
        setVisibleItems(itemsPerView.tablet)
      } else {
        setVisibleItems(itemsPerView.desktop)
      }
    }

    updateVisibleItems()
    window.addEventListener('resize', updateVisibleItems)
    return () => window.removeEventListener('resize', updateVisibleItems)
  }, [itemsPerView])

  const maxIndex = Math.max(0, totalItems - visibleItems)

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1))
  }, [maxIndex])

  const goToIndex = (index) => {
    setCurrentIndex(Math.min(index, maxIndex))
  }

  // Auto-play
  useEffect(() => {
    if (!autoPlay || totalItems <= visibleItems) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, goToNext, totalItems, visibleItems])

  // Reset index when visible items change
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex)
    }
  }, [currentIndex, maxIndex])

  // Don't show carousel controls if all items fit
  const showControls = totalItems > visibleItems

  // Calculate dot count (number of "pages")
  const dotCount = maxIndex + 1

  return (
    <div className={`relative ${className}`}>
      {/* Carousel container */}
      <div className="overflow-hidden pb-4">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleItems)}%)`,
          }}
        >
          {items.map((child, index) => (
            <div
              key={index}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / visibleItems}%` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Arrow buttons */}
      {showArrows && showControls && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 bg-white shadow-lg rounded-full p-1.5 md:p-2 hover:bg-gray-100 transition-colors z-10 flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 bg-white shadow-lg rounded-full p-1.5 md:p-2 hover:bg-gray-100 transition-colors z-10 flex items-center justify-center"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
          </button>
        </>
      )}

      {/* Dots navigation */}
      {showDots && showControls && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: dotCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-primary-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Carousel
