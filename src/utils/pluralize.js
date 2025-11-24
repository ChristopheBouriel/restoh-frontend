/**
 * Pluralize a word based on count
 * @param {number} count - The count to determine singular or plural
 * @param {string} singular - The singular form of the word
 * @param {string} [plural] - The plural form (optional, defaults to singular + 's')
 * @param {boolean} [includeCount=true] - Whether to include the count in the result
 * @returns {string} The pluralized string
 *
 * @example
 * pluralize(1, 'item') // "1 item"
 * pluralize(2, 'item') // "2 items"
 * pluralize(0, 'guest') // "0 guests"
 * pluralize(1, 'table', 'tables', false) // "table"
 * pluralize(5, 'table', 'tables', false) // "tables"
 */
export const pluralize = (count, singular, plural = null, includeCount = true) => {
  const word = count === 1 ? singular : (plural || `${singular}s`)
  return includeCount ? `${count} ${word}` : word
}

/**
 * Get only the word part (without count)
 * @param {number} count - The count to determine singular or plural
 * @param {string} singular - The singular form of the word
 * @param {string} [plural] - The plural form (optional, defaults to singular + 's')
 * @returns {string} The pluralized word only
 *
 * @example
 * pluralizeWord(1, 'item') // "item"
 * pluralizeWord(2, 'item') // "items"
 * pluralizeWord(0, 'guest') // "guests"
 */
export const pluralizeWord = (count, singular, plural = null) => {
  return pluralize(count, singular, plural, false)
}
