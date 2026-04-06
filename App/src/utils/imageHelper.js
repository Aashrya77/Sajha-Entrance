// Helper function to convert image paths to full URLs
export const getImageUrl = (imagePath, folder = '') => {
  if (!imagePath) return null;

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const cleanFolder = (folder || '').replace(/^\/+|\/+$/g, '');
  const cleanPath = imagePath.replace(/^\/+/, '');
  const withFolder = cleanFolder ? `${cleanFolder}/${cleanPath}` : cleanPath;

  const baseUrl = import.meta.env.PROD 
    ? 'https://sajhaentrance.org' 
    : 'http://localhost:5000';
  
  return `${baseUrl}/${withFolder}`;
};
