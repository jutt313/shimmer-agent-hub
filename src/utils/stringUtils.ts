
/**
 * String utility functions for text processing
 */
export const cleanText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove JSON-like structures
  let cleanedText = text.replace(/\{[\s\S]*?\}/g, '');
  
  // Remove code blocks
  cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
  
  // Remove excessive whitespace and normalize
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  return cleanedText;
};

/**
 * Remove markdown-style code blocks from text
 */
export const removeCodeBlocks = (text: string): string => {
  if (!text) return '';
  return text.replace(/```[\s\S]*?```/g, '').trim();
};
