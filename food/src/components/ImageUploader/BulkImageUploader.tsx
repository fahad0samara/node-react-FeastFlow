import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { cloudinaryService } from '../../services/cloudinaryService';
import { AiOutlineCloudUpload, AiOutlineDelete } from 'react-icons/ai';
import { BsImages } from 'react-icons/bs';

interface BulkUploadResult {
  success: boolean;
  originalName: string;
  url?: string;
  publicId?: string;
  error?: string;
}

interface BulkImageUploaderProps {
  onImagesUpload: (urls: string[], publicIds: string[]) => void;
  category?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  className?: string;
}

const BulkImageUploader: React.FC<BulkImageUploaderProps> = ({
  onImagesUpload,
  category = 'uncategorized',
  maxSize = 5,
  maxFiles = 10,
  className = '',
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const validateFiles = (files: File[]): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Please upload JPG, PNG, GIF, or WebP images.`);
        return false;
      }

      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Maximum size is ${maxSize}MB.`);
        return false;
      }
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files at once.`);
      return;
    }

    if (validateFiles(files)) {
      setSelectedFiles(files);
    }
  };

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.warning('Please select files to upload.');
      return;
    }

    setUploading(true);
    const results: BulkUploadResult[] = [];
    const successfulUrls: string[] = [];
    const successfulPublicIds: string[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        try {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.round((i / selectedFiles.length) * 100)
          }));

          const result = await cloudinaryService.uploadImage(file, {
            tags: ['menu-item', category]
          });

          results.push({
            success: true,
            originalName: file.name,
            url: result.url,
            publicId: result.public_id
          });

          successfulUrls.push(result.url);
          successfulPublicIds.push(result.public_id);

          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
        } catch (error: any) {
          results.push({
            success: false,
            originalName: file.name,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}.`);
        onImagesUpload(successfulUrls, successfulPublicIds);
      }

      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} image${failCount > 1 ? 's' : ''}.`);
      }
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setSelectedFiles([]);
      setUploadProgress({});
    }
  }, [selectedFiles, category, onImagesUpload]);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer">
          <BsImages className="text-xl" />
          Select Images
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            disabled={uploading}
          />
        </label>
        {selectedFiles.length > 0 && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            <AiOutlineCloudUpload className="text-xl" />
            {uploading ? 'Uploading...' : 'Upload All'}
          </button>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative group">
              <div className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-32 object-cover rounded shadow-lg"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <AiOutlineDelete />
                </button>
              </div>
              {uploadProgress[file.name] !== undefined && (
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {uploadProgress[file.name]}%
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600 truncate mt-1">{file.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BulkImageUploader;
