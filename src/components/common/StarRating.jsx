import { Star } from 'lucide-react'

/**
 * StarRating component - Display or input star ratings
 * @param {number} rating - Current rating (1-5)
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

  return (
    <div className="flex items-center gap-1">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1
        const isFilled = starValue <= rating

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
            <Star
              className={`${iconSize} ${
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300'
              }`}
            />
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
