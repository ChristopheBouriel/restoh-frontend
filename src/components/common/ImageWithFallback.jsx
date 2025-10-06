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

  // Déterminer le src final
  const getFinalSrc = () => {
    // Pas de src ou erreur → placeholder
    if (!src || src === '' || hasError) {
      return placeholderSvg
    }
    
    // URL complète (http/https) → utiliser tel quel (pour les ajouts admin)
    if (src.startsWith('http')) {
      return src
    }
    
    // Nom de fichier simple → construire le chemin local (pour les articles existants)
    if (!src.includes('/')) {
      return `/images/menu/${src}`
    }
    
    // Chemin déjà complet → utiliser tel quel
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