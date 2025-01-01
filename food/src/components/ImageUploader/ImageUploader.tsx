import React, { useRef, useState, useCallback } from 'react';
import { AiOutlineCloudUpload, AiOutlineEdit, AiOutlineReload, AiOutlineDelete, AiOutlineInfoCircle } from "react-icons/ai";
import { toast } from "react-toastify";
import { cloudinaryService, ImageInfo } from '../../services/cloudinaryService';

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string, publicId: string) => void;
  onImageDelete: () => void;
  category?: string;
  maxSize?: number; // in MB
  aspectRatio?: number;
  initialImage?: string;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  onImageDelete,
  category = 'uncategorized',
  maxSize = 10,
  aspectRatio,
  initialImage,
  className = '',
}) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialImage || '');
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
        resolve(false);
        return;
      }

      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File size too large. Please upload an image under ${maxSize}MB.`);
        resolve(false);
        return;
      }

      if (aspectRatio) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          const ratio = img.width / img.height;
          URL.revokeObjectURL(img.src);
          if (Math.abs(ratio - aspectRatio) > 0.1) {
            toast.error(`Please upload an image with ${aspectRatio}:1 aspect ratio.`);
            resolve(false);
          } else {
            resolve(true);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          toast.error('Failed to load image.');
          resolve(false);
        };
      } else {
        resolve(true);
      }
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isValid = await validateImage(file);
    if (!isValid) return;

    setImage(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      // Upload to Cloudinary
      const result = await cloudinaryService.uploadImage(file, {
        tags: ['menu-item', category]
      });
      
      // Get image info
      const info = await cloudinaryService.getImageInfo(result.public_id);
      setImageInfo(info);
      onImageUpload(result.url, result.public_id);
      toast.success('Image uploaded successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleOptimizeImage = useCallback(async () => {
    if (!imageInfo) return;

    try {
      setOptimizing(true);
      const result = await cloudinaryService.optimizeImage(imageInfo.public_id, {
        width: 800,
        height: 800,
        crop: 'limit',
        quality: 'auto',
        format: 'auto',
        effect: 'auto_contrast'
      });

      if (result.url) {
        setImagePreview(result.url);
        onImageUpload(result.url, imageInfo.public_id);
        toast.success('Image optimized successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to optimize image');
    } finally {
      setOptimizing(false);
    }
  }, [imageInfo, onImageUpload]);

  const handleRestoreImage = useCallback(async () => {
    if (!imageInfo) return;

    try {
      setRestoring(true);
      const result = await cloudinaryService.restoreImage(imageInfo.public_id);
      if (result.url) {
        setImagePreview(result.url);
        onImageUpload(result.url, imageInfo.public_id);
        toast.success('Image restored successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restore image');
    } finally {
      setRestoring(false);
    }
  }, [imageInfo, onImageUpload]);

  const handleDeleteImage = useCallback(async () => {
    if (!imageInfo) return;

    try {
      await cloudinaryService.deleteImage(imageInfo.public_id);
      setImage(null);
      setImagePreview('');
      setImageInfo(null);
      onImageDelete();
      toast.success('Image deleted successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete image');
    }
  }, [imageInfo, onImageDelete]);

  const handleViewInfo = useCallback(async () => {
    if (!imageInfo) return;

    try {
      const info = await cloudinaryService.getImageInfo(imageInfo.public_id);
      setImageInfo(info);
      toast.info(`Image Info:\nSize: ${(info.bytes / 1024).toFixed(2)} KB\nDimensions: ${info.width}x${info.height}\nFormat: ${info.format}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to get image info');
    }
  }, [imageInfo]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          <AiOutlineCloudUpload className="text-xl" />
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
        {imagePreview && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleOptimizeImage}
              disabled={optimizing || !imageInfo}
              className="p-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              title="Optimize Image"
            >
              <AiOutlineEdit className="text-xl" />
            </button>
            <button
              type="button"
              onClick={handleRestoreImage}
              disabled={restoring || !imageInfo}
              className="p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              title="Restore Original"
            >
              <AiOutlineReload className="text-xl" />
            </button>
            <button
              type="button"
              onClick={handleDeleteImage}
              disabled={!imageInfo}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              title="Delete Image"
            >
              <AiOutlineDelete className="text-xl" />
            </button>
            <button
              type="button"
              onClick={handleViewInfo}
              disabled={!imageInfo}
              className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              title="View Info"
            >
              <AiOutlineInfoCircle className="text-xl" />
            </button>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
      />
      
      {imagePreview && (
        <div className="relative group">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-xs rounded shadow-lg transition-transform group-hover:scale-105"
          />
          {imageInfo && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-sm rounded-b opacity-0 group-hover:opacity-100 transition-opacity">
              <p>Size: {(imageInfo.bytes / 1024).toFixed(2)} KB</p>
              <p>Dimensions: {imageInfo.width}x{imageInfo.height}</p>
              <p>Format: {imageInfo.format}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
