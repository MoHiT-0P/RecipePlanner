// This function cleans a "dirty" ingredient string into its core component
export const cleanIngredient = (text) => {
    if (typeof text !== 'string') return '';
    return text
        .toLowerCase()
        // Remove numbers, units, and common preparation words
        .replace(/([\d/]+|cup|cups|tsp|tbsp|g|kg|oz|ml|l|diced|chopped|minced|sliced|whole|peeled|grated)/g, '')
        .replace(/[,-]/g, ' ') // Replace commas and hyphens with spaces
        .trim()
        .split(' ')[0]; // Take the first word
};