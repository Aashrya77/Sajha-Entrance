// Helper function to convert image paths to full URLs
export const getImageUrl = (imagePath, folder = '') => {
  if (!imagePath) return null;

  // Already a full URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Clean the path
  const cleanPath = imagePath.replace(/^\/+/, '');
  const cleanFolder = (folder || '').replace(/^\/+|\/+$/g, '');

  const baseUrl = import.meta.env.PROD 
    ? 'https://sajhaentrance.org' 
    : 'http://localhost:5000';
  
  // If path already includes folder structure (new format), use as-is under /uploads
  if (cleanPath.includes('/')) {
    return `${baseUrl}/uploads/${cleanPath}`;
  }
  
  // If folder is provided, use it directly as route (legacy format)
  // e.g., folder='colleges' -> /colleges/pcps.jpg
  if (cleanFolder) {
    return `${baseUrl}/${cleanFolder}/${cleanPath}`;
  }
  
  // Fallback: assume it's in uploads root
  return `${baseUrl}/uploads/${cleanPath}`;
};
