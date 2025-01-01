import React, { useState } from 'react';
import ImageGallery from '../components/ImageGallery/ImageGallery';
import BulkImageUploader from '../components/ImageUploader/BulkImageUploader';
import { ImageInfo } from '../services/cloudinaryService';
import { toast } from 'react-toastify';

const MenuImageManager: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImagesUpload = (urls: string[], publicIds: string[]) => {
    setRefreshKey(prev => prev + 1);
    toast.success(`Successfully uploaded ${urls.length} image${urls.length !== 1 ? 's' : ''}`);
  };

  const handleImageSelect = (image: ImageInfo) => {
    // Handle image selection if needed
    console.log('Selected image:', image);
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Menu Image Manager</h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Category Filter</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-64 p-2 border rounded"
          >
            <option value="">All Categories</option>
            <option value="appetizers">Appetizers</option>
            <option value="main-courses">Main Courses</option>
            <option value="desserts">Desserts</option>
            <option value="beverages">Beverages</option>
          </select>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload Images</h2>
          <BulkImageUploader
            onImagesUpload={handleImagesUpload}
            category={selectedCategory}
            maxSize={5}
            maxFiles={10}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Image Gallery</h2>
          <ImageGallery
            key={refreshKey}
            category={selectedCategory}
            onImageSelect={handleImageSelect}
            multiSelect={true}
            showActions={true}
          />
        </div>
      </div>
    </div>
  );
};

export default MenuImageManager;
