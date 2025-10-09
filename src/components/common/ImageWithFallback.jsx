import { useState } from 'react'

const ImageWithFallback = ({ 
  src, 
  alt, 
  className = "", 
  ...props 
}) => {
  const [hasError, setHasError] = useState(false)
  
  // SVG placeholder
  const placeholderSvg = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjEyMCIgcj0iMjAiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE1MCAyMDBMMTgwIDE3MEwyMjAgMjEwTDI1MCAyMDBMMTUwIDIwMFoiIGZpbGw9IiM2Mzc1OEYiLz4KPHRleHQgeD0iMjAwIiB5PSIyNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY5NzA3OCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UGxhdCBkZSByZXN0YXVyYW50PC90ZXh0Pgo8L3N2Zz4="

  // Determine the final src
  const getFinalSrc = () => {
    // No src or error → placeholder
    if (!src || src === '' || hasError) {
      return placeholderSvg
    }

    // Full URL (http/https) → use as is (for admin additions)
    if (src.startsWith('http')) {
      return src
    }

    // Simple filename → build local path (for existing articles)
    if (!src.includes('/')) {
      return `/images/menu/${src}`
    }

    // Already complete path → use as is
    return src
  }

  const finalSrc = getFinalSrc()
  
  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  )
}

export default ImageWithFallback