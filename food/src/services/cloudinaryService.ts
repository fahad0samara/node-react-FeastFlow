
import axios from 'axios';
import {
  CLOUDINARY_UPLOAD_URL,
  CLOUDINARY_BULK_UPLOAD_URL,
  CLOUDINARY_DELETE_IMAGE_URL,
  CLOUDINARY_OPTIMIZE_IMAGE_URL,
  CLOUDINARY_RESTORE_IMAGE_URL,
  CLOUDINARY_IMAGE_INFO_URL,
  CLOUDINARY_LIST_IMAGES_URL,
  CLOUDINARY_SEARCH_BY_TAGS_URL,
  BACKEND_URL
} from '../urls';

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  effect?: string;
  format?: string;
  angle?: number;
}

export interface ImageInfo {
  public_id: string;
  secure_url: string;
  bytes: number;
  created_at: string;
  format: string;
  width: number;
  height: number;
  tags: string[];
}

export interface BulkUploadResult {
  success: boolean;
  originalName: string;
  url?: string;
  publicId?: string;
  error?: string;
}

class CloudinaryService {
  async uploadImage(file: File, options?: { watermark?: boolean; tags?: string[] }) {
    const formData = new FormData();
    formData.append('image', file);
    
    if (options?.watermark) {
      formData.append('watermark', 'true');
    }
    
    if (options?.tags) {
      formData.append('tags', options.tags.join(','));
    }

    const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async uploadBulkImages(files: File[], options?: { watermark?: boolean; tags?: string[] }) {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('images', file);
    });
    
    if (options?.watermark) {
      formData.append('watermark', 'true');
    }
    
    if (options?.tags) {
      formData.append('tags', options.tags.join(','));
    }

    const response = await axios.post(CLOUDINARY_BULK_UPLOAD_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async deleteImage(publicId: string) {
    const response = await axios.delete(CLOUDINARY_DELETE_IMAGE_URL(publicId));
    return response.data;
  }

  async optimizeImage(publicId: string, options: TransformationOptions): Promise<{ url: string }> {
    try {
      const response = await axios.post(`${BACKEND_URL}/cloudinary/optimize`, {
        publicId,
        options
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async restoreImage(publicId: string) {
    const response = await axios.post(CLOUDINARY_RESTORE_IMAGE_URL(publicId));
    return response.data;
  }

  async getImageInfo(publicId: string): Promise<ImageInfo> {
    try {
      const response = await axios.get(`${BACKEND_URL}/cloudinary/info/${publicId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async listImages(options?: { maxResults?: number; nextCursor?: string }): Promise<{ resources: ImageInfo[]; next_cursor?: string }> {
    try {
      const response = await axios.get(`${BACKEND_URL}/cloudinary/list`, {
        params: options
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async searchByTags(tags: string[]): Promise<{ resources: ImageInfo[] }> {
    try {
      const response = await axios.post(`${BACKEND_URL}/cloudinary/search`, { tags });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Helper methods
  async optimizeAndWatermark(publicId: string) {
    const optimized = await this.optimizeImage(publicId, {
      width: 800,
      height: 800,
      crop: 'limit',
      quality: 'auto',
      format: 'auto',
      effect: 'auto_contrast',
      watermark: true
    });
    return optimized;
  }

  async uploadWithBackup(file: File, options?: { watermark?: boolean; tags?: string[] }) {
    const result = await this.uploadImage(file, options);
    await this.uploadImage(file, { ...options, tags: [...(options?.tags || []), 'backup'] });
    return result;
  }

  async deleteWithBackup(publicId: string) {
    await Promise.all([
      this.deleteImage(publicId),
      this.deleteImage(`${publicId}_backup`)
    ]);
  }

  handleError(error: any) {
    // implement error handling logic here
  }
}

export const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
