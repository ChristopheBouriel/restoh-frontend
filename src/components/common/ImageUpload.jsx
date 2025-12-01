import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

const ImageUpload = ({ value, onChange, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(value || null)
  const fileInputRef = useRef(null)

  const acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSizeInMB = 5
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024

  const validateFile = (file) => {
    if (!acceptedFormats.includes(file.type)) {
      return { isValid: false, error: 'Format not accepted. Use JPEG, PNG or WebP.' }
    }
    if (file.size > maxSizeInBytes) {
      return { isValid: false, error: `File too large. Maximum ${maxSizeInMB}MB.` }
    }
    return { isValid: true, error: null }
  }

  const handleFile = (file) => {
    const validation = validateFile(file)

    if (!validation.isValid) {
      alert(validation.error)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
    }
    reader.readAsDataURL(file)

    // Pass file to parent
    onChange(file)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileInput = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClick}
            className="absolute bottom-2 right-2 px-3 py-1 bg-white text-gray-700 rounded-md text-sm hover:bg-gray-100 transition-colors border border-gray-300"
          >
            Change
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            w-full h-48 border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center
            cursor-pointer transition-colors
            ${isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-gray-100'
            }
          `}
        >
          <div className="flex flex-col items-center space-y-2">
            {isDragging ? (
              <Upload className="w-12 h-12 text-primary-500" />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-400" />
            )}
            <p className="text-sm text-gray-600 text-center px-4">
              {isDragging ? (
                <span className="font-medium text-primary-600">Drop image here</span>
              ) : (
                <>
                  <span className="font-medium text-primary-600">Click to upload</span>
                  {' '}or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-gray-500">
              JPEG, PNG or WebP (max {maxSizeInMB}MB)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload
