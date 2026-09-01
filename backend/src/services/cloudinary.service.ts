import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  resourceType: string;
  width: number;
  height: number;
}

export async function uploadImage(
  fileBuffer: Buffer,
  folder: string
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `inviora/${folder}`,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(new AppError('Image upload failed', 500));
          return;
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          resourceType: result.resource_type,
          width: result.width,
          height: result.height,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Log but don't throw — orphaned cleanup is best-effort
  }
}

export function getOptimizedUrl(
  publicId: string,
  options: { width?: number; height?: number } = {}
): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        quality: 'auto',
        fetch_format: 'auto',
        ...(options.width && { width: options.width }),
        ...(options.height && { height: options.height }),
        crop: 'limit',
      },
    ],
  });
}
