import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dusn4hkm9',
  api_key: process.env.CLOUDINARY_API_KEY || '316771894226779',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'IUueEoS3-3_ksW7OyIvqTNKLeog'
});

// Function to upload an image buffer to Cloudinary with compression
export const uploadImageBuffer = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'samagam_images',
          // Add image optimization parameters
          quality: 'auto', // Automatic quality optimization
          fetch_format: 'auto', // Automatic format optimization
          width: 1200, // Max width
          crop: 'limit', // Limit dimensions without cropping
          format: 'jpg', // Convert to jpg
          compression: 'low' // Apply compression
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(buffer);
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export default cloudinary; 