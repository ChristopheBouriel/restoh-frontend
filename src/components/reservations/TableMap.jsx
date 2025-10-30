import { useState } from 'react'
import { TABLES_CONFIG, DECORATIONS } from '../../utils/tablesConfig'

const TableMap = ({ selectedTables = [], onTableSelect, occupiedTables = [], notEligibleTables = [], previouslyBookedTables = [], isLoading = false, partySize = 1 }) => {
  const [hoveredTable, setHoveredTable] = useState(null)

  // Calculate current total capacity of selected tables
  const currentCapacity = selectedTables.reduce((sum, tableId) => {
    const table = TABLES_CONFIG.find(t => t.id === tableId)
    return sum + (table?.capacity || 0)
  }, 0)

  // Maximum allowed capacity is partySize + 1 (1 extra seat allowed)
  const maxAllowedCapacity = partySize + 1

  // Check if adding a table would exceed the maximum capacity
  const wouldExceedCapacity = (tableId) => {
    // If table is already selected, we're deselecting it, so no capacity check needed
    if (selectedTables.includes(tableId)) {
      return false
    }

    const table = TABLES_CONFIG.find(t => t.id === tableId)
    if (!table) return false

    return currentCapacity + table.capacity > maxAllowedCapacity
  }

  const handleTableClick = (tableId) => {
    // Can't select occupied tables
    if (occupiedTables.includes(tableId)) return

    // Can't select tables that are too large (from backend)
    if (notEligibleTables.includes(tableId)) return

    // Can't select if it would exceed capacity (unless deselecting)
    if (wouldExceedCapacity(tableId)) return

    onTableSelect(tableId)
  }

  const getTableStatus = (tableId) => {
    const status = occupiedTables.includes(tableId) ? 'occupied'
      : notEligibleTables.includes(tableId) ? 'not-eligible'
      : selectedTables.includes(tableId) ? 'selected'
      : previouslyBookedTables.includes(tableId) ? 'previously-booked'
      : wouldExceedCapacity(tableId) ? 'not-eligible'
      : 'available'

    return status
  }

  const getTableStyle = (status, isHovered) => {
    const baseStyle = 'border-2 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center font-semibold text-sm'

    if (status === 'occupied') {
      return `${baseStyle} bg-red-100 border-red-300 text-red-700 cursor-not-allowed opacity-60`
    }
    if (status === 'not-eligible') {
      return `${baseStyle} bg-gray-200 border-gray-400 text-gray-500 cursor-not-allowed opacity-50`
    }
    if (status === 'selected') {
      return `${baseStyle} bg-orange-500 border-orange-600 text-white shadow-lg transform scale-105`
    }
    if (status === 'previously-booked') {
      return `${baseStyle} bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200 hover:border-blue-500`
    }
    if (isHovered) {
      return `${baseStyle} bg-green-100 border-green-400 text-green-700 shadow-md`
    }
    return `${baseStyle} bg-white border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50`
  }

  const getTableDimensions = (capacity) => {
    const height = 50
    const width = capacity === 2 ? 50 : capacity === 4 ? 100 : 150
    return { width, height }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-2 sm:p-4 relative">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
            <p className="mt-2 text-sm text-gray-600">Loading tables...</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-2 sm:gap-4 text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white border-2 border-gray-300 rounded"></div>
          <span className="text-xs">Available</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-orange-500 border-2 border-orange-600 rounded"></div>
          <span className="text-xs">Selected</span>
        </div>
        {previouslyBookedTables.length > 0 && (
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-4 h-4 sm:w-6 sm:h-6 bg-blue-100 border-2 border-blue-400 rounded"></div>
            <span className="text-xs">Previously booked</span>
          </div>
        )}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-red-100 border-2 border-red-300 rounded opacity-60"></div>
          <span className="text-xs">Occupied</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-200 border-2 border-gray-400 rounded opacity-50"></div>
          <span className="text-xs">Not eligible</span>
        </div>
      </div>

      {/* Floor Plan - Responsive container */}
      <div className="flex justify-center w-full overflow-x-auto pt-4">
        <div className="inline-block">
          <div
            className="relative bg-white rounded-lg border-2 border-orange-500 overflow-hidden origin-top"
            style={{
              width: '600px',
              height: '780px',
              transform: 'scale(0.5)',
            }}
          >
            <style dangerouslySetInnerHTML={{__html: `
              @media (min-width: 640px) {
                .origin-top {
                  transform: scale(0.65) !important;
                }
              }
              @media (min-width: 768px) {
                .origin-top {
                  transform: scale(0.75) !important;
                }
              }
              @media (min-width: 1024px) {
                .origin-top {
                  transform: scale(0.85) !important;
                }
              }
              @media (min-width: 1280px) {
                .origin-top {
                  transform: scale(1) !important;
                }
              }
            `}} />
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-primary-600 text-white flex items-center justify-center font-bold text-lg border-b-2 border-gray-300">
          🚪 Entrance
        </div>

        {/* Bay Window */}
        {DECORATIONS.filter(d => d.type === 'bay-window').map(decoration => (
          <div
            key={decoration.id}
            className="absolute bg-orange-50 border-2 border-orange-300 rounded flex items-center justify-center"
            style={{
              left: `${decoration.x}px`,
              top: `${decoration.y}px`,
              width: `${decoration.width}px`,
              height: `${decoration.height}px`
            }}
          >
            <div className="transform -rotate-90 text-xs font-semibold text-orange-700 whitespace-nowrap">
              Bay Window
            </div>
          </div>
        ))}

        {/* Bar/Counter */}
        {DECORATIONS.filter(d => d.type === 'bar').map(decoration => (
          <div
            key={decoration.id}
            className="absolute bg-amber-100 border-2 border-amber-400 rounded flex items-center justify-center"
            style={{
              left: `${decoration.x}px`,
              top: `${decoration.y}px`,
              width: `${decoration.width}px`,
              height: `${decoration.height}px`
            }}
          >
            <div className="transform -rotate-90 text-sm font-bold text-amber-800 whitespace-nowrap">
              Bar / Counter
            </div>
          </div>
        ))}

        {/* Tables */}
        {TABLES_CONFIG.map(table => {
          const { width, height } = getTableDimensions(table.capacity)
          const status = getTableStatus(table.id)
          const isHovered = hoveredTable === table.id

          return (
            <div key={table.id}>
              {/* Box decoration if needed */}
              {table.isBox && (
                <div
                  className="absolute border-2 border-dashed border-orange-400 bg-orange-50 rounded-lg"
                  style={{
                    left: `${table.x - 15}px`,
                    top: `${table.y - 35}px`,
                    width: `${width + 30}px`,
                    height: `${height + 55}px`
                  }}
                >
                  <div className="text-xs font-semibold text-orange-700 text-center mt-1">
                    Box {table.id === 21 ? '1' : '2'}
                  </div>
                </div>
              )}

              {/* Table */}
              <button
                type="button"
                onClick={() => handleTableClick(table.id)}
                onMouseEnter={() => setHoveredTable(table.id)}
                onMouseLeave={() => setHoveredTable(null)}
                disabled={status === 'occupied' || status === 'not-eligible'}
                className={getTableStyle(status, isHovered)}
                style={{
                  position: 'absolute',
                  left: `${table.x}px`,
                  top: `${table.y}px`,
                  width: `${width}px`,
                  height: `${height}px`
                }}
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="font-bold">{table.id}</span>
                  <span className="text-xs">({table.capacity}p)</span>
                </div>
              </button>
            </div>
          )
        })}

        {/* Kitchen */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-orange-200 border-t-2 border-orange-300 flex items-center justify-center font-semibold text-gray-700">
          🍽️ Kitchen
        </div>
          </div>
        </div>
      </div>

      {/* Selected Tables Summary */}
      {selectedTables.length > 0 && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm font-semibold text-orange-900 mb-1">
            Selected Tables: {selectedTables.length}
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedTables.sort((a, b) => a - b).map(tableId => {
              const table = TABLES_CONFIG.find(t => t.id === tableId)
              return (
                <span key={tableId} className="inline-flex items-center px-2 py-1 bg-orange-500 text-white text-xs rounded">
                  #{tableId} ({table?.capacity}p)
                </span>
              )
            })}
          </div>
          <p className="text-xs text-orange-700 mt-2">
            Total capacity: {selectedTables.reduce((sum, tableId) => {
              const table = TABLES_CONFIG.find(t => t.id === tableId)
              return sum + (table?.capacity || 0)
            }, 0)} guests
          </p>
        </div>
      )}
    </div>
  )
}

export default TableMap
