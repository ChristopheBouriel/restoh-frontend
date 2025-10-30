// Tables configuration
export const TABLES_CONFIG = [
  // Row 1 - 3 tables for 2 (more spaced)
  { id: 1, capacity: 2, x: 100, y: 100 },
  { id: 2, capacity: 2, x: 210, y: 100 },
  { id: 3, capacity: 2, x: 320, y: 100 },

  // Row 2 - 3 tables for 2
  { id: 4, capacity: 2, x: 100, y: 180 },
  { id: 5, capacity: 2, x: 210, y: 180 },
  { id: 6, capacity: 2, x: 320, y: 180 },

  // Row 3 - 3 tables for 2
  { id: 7, capacity: 2, x: 100, y: 260 },
  { id: 8, capacity: 2, x: 210, y: 260 },
  { id: 9, capacity: 2, x: 320, y: 260 },

  // Row 4 - 3 tables for 2
  { id: 10, capacity: 2, x: 100, y: 340 },
  { id: 11, capacity: 2, x: 210, y: 340 },
  { id: 12, capacity: 2, x: 320, y: 340 },

  // Row 5 - 2 tables for 4
  { id: 13, capacity: 4, x: 80, y: 430 },
  { id: 14, capacity: 4, x: 210, y: 430 },

  // Row 6 - 2 tables for 4
  { id: 15, capacity: 4, x: 80, y: 510 },
  { id: 16, capacity: 4, x: 210, y: 510 },

  // Row 7 - 2 tables for 4
  { id: 17, capacity: 4, x: 80, y: 590 },
  { id: 18, capacity: 4, x: 210, y: 590 },

  // Row 8 - 2 tables for 4
  { id: 19, capacity: 4, x: 80, y: 670 },
  { id: 20, capacity: 4, x: 210, y: 670 },

  // Box 1 with table for 6
  { id: 21, capacity: 6, x: 420, y: 460, isBox: true },

  // Box 2 with table for 6
  { id: 22, capacity: 6, x: 420, y: 570, isBox: true }
]

// Decoration elements
export const DECORATIONS = [
  // Bay Window (left wall - thin vertical rectangle)
  { id: 'bay-window', type: 'bay-window', x: 5, y: 65, width: 20, height: 660 },

  // Bar/Counter (right wall - 20px from edge)
  { id: 'bar', type: 'bar', x: 480, y: 80, width: 60, height: 330 }
]

// Helper function to get table capacity
export const getTableCapacity = (tableId) => {
  const table = TABLES_CONFIG.find(t => t.id === tableId)
  return table?.capacity || 0
}

// Helper function to calculate total capacity of selected tables
export const calculateTotalCapacity = (tableIds) => {
  return tableIds.reduce((sum, tableId) => {
    return sum + getTableCapacity(tableId)
  }, 0)
}

// Helper to filter tables that exceed capacity
export const filterTablesByCapacity = (tableIds, partySize) => {
  const maxAllowedCapacity = partySize + 1

  return tableIds.filter(tableId => {
    const totalCapacity = calculateTotalCapacity(tableIds)
    const tableCapacity = getTableCapacity(tableId)

    // Keep tables if removing them would make total capacity too small
    // or if total is within limits
    return totalCapacity - tableCapacity < partySize || totalCapacity <= maxAllowedCapacity
  })
}
