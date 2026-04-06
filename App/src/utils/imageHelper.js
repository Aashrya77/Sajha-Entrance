// Helper function to convert image paths to full URLs
export const getImageUrl = (imagePath, folder = '') => {
  if (!imagePath) return null;

  // Already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Clean the path
  const cleanPath = imagePath.replace(/^\/+/, '');

  // All images are served from /uploads/
  // If path doesn't start with 'uploads/', prepend it
  const fullPath = cleanPath.startsWith('uploads/') 
    ? cleanPath 
    : `uploads/${cleanPath}`;

  const baseUrl = import.meta.env.PROD 
    ? 'https://sajhaentrance.org' 
    : 'http://localhost:5000';
  
  return `${baseUrl}/${fullPath}`;
};
