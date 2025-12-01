import { Star } from 'lucide-react'

/**
 * StarRating component - Display or input star ratings
 * Supports half-star display for readonly mode (e.g., 4.5 stars)
 *
 * @param {number} rating - Current rating (0-5, supports decimals for display)
 * @param {function} onChange - Callback for rating change (optional, makes it interactive)
 * @param {number} maxStars - Maximum number of stars (default: 5)
 * @param {string} size - Size of stars: 'sm', 'md', 'lg' (default: 'md')
 * @param {boolean} showRating - Show numeric rating next to stars (default: false)
 * @param {boolean} readonly - Make it readonly (default: based on onChange presence)
 */
const StarRating = ({
  rating = 0,
  onChange,
  maxStars = 5,
  size = 'md',
  showRating = false,
  readonly
}) => {
  const isInteractive = !readonly && onChange

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const iconSize = sizeClasses[size] || sizeClasses.md

  const handleStarClick = (starValue) => {
    if (isInteractive) {
      onChange(starValue)
    }
  }

  /**
   * Render a single star (full, half, or empty)
   * @param {number} index - Star index (0-based)
   * @returns {JSX.Element}
   */
  const renderStar = (index) => {
    const starValue = index + 1

    // For interactive mode, use simple full/empty logic
    if (isInteractive) {
      const isFilled = starValue <= rating
      return (
        <Star
          className={`${iconSize} ${
            isFilled
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-none text-gray-300'
          }`}
        />
      )
    }

    // For readonly mode, support half stars
    const difference = rating - index

    if (difference >= 1) {
      // Full star
      return (
        <Star
          className={`${iconSize} fill-yellow-400 text-yellow-400`}
        />
      )
    } else if (difference >= 0.5) {
      // Half star - use overlay technique for precise half display
      return (
        <div className="relative">
          {/* Empty star background */}
          <Star className={`${iconSize} fill-none text-gray-300`} />
          {/* Half-filled overlay */}
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star className={`${iconSize} fill-yellow-400 text-yellow-400`} />
          </div>
        </div>
      )
    } else {
      // Empty star
      return (
        <Star
          className={`${iconSize} fill-none text-gray-300`}
        />
      )
    }
  }

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(starValue)}
            className={`${
              isInteractive
                ? 'cursor-pointer hover:scale-110 transition-transform'
                : 'cursor-default'
            } focus:outline-none`}
            disabled={!isInteractive}
            aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            {renderStar(index)}
          </button>
        )
      })}
      {showRating && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default StarRating
