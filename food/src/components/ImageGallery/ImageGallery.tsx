import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { cloudinaryService, ImageInfo } from '../../services/cloudinaryService';
import { AiOutlineEdit, AiOutlineReload, AiOutlineDelete, AiOutlineInfoCircle, AiOutlineSearch, AiOutlineFilter } from 'react-icons/ai';
import { BsSortDown, BsSortUp } from 'react-icons/bs';
import { MdOutlinePhotoFilter } from 'react-icons/md';
import DragAndDrop from '../ImageUploader/DragAndDrop';
import ImageEditor from '../ImageEditor/ImageEditor';

interface ImageGalleryProps {
  onImageSelect?: (image: ImageInfo) => void;
  category?: string;
  multiSelect?: boolean;
  showActions?: boolean;
  className?: string;
}

interface FilterOptions {
  tags: string[];
  format: string;
  size: string;
  date: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  onImageSelect,
  category,
  multiSelect = false,
  showActions = true,
  className = '',
}) => {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    tags: [],
    format: '',
    size: '',
    date: ''
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [editingImage, setEditingImage] = useState<ImageInfo | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      let fetchedImages: ImageInfo[];

      if (category) {
        const result = await cloudinaryService.searchByTags([category]);
        fetchedImages = result.resources;
      } else {
        const result = await cloudinaryService.listImages();
        fetchedImages = result.resources;
      }

      // Apply filters
      let filteredImages = fetchedImages.filter(image => {
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          return (
            image.public_id.toLowerCase().includes(searchLower) ||
            image.tags.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }
        return true;
      });

      if (filterOptions.tags.length > 0) {
        filteredImages = filteredImages.filter(image =>
          filterOptions.tags.some(tag => image.tags.includes(tag))
        );
      }

      if (filterOptions.format) {
        filteredImages = filteredImages.filter(image =>
          image.format === filterOptions.format
        );
      }

      if (filterOptions.size) {
        const [min, max] = filterOptions.size.split('-').map(Number);
        filteredImages = filteredImages.filter(image => {
          const sizeInMB = image.bytes / (1024 * 1024);
          return sizeInMB >= min && sizeInMB <= max;
        });
      }

      if (filterOptions.date) {
        const days = parseInt(filterOptions.date);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        filteredImages = filteredImages.filter(image =>
          new Date(image.created_at) >= cutoffDate
        );
      }

      // Apply sorting
      filteredImages.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'date':
            comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            break;
          case 'size':
            comparison = b.bytes - a.bytes;
            break;
          case 'name':
            comparison = a.public_id.localeCompare(b.public_id);
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });

      setImages(filteredImages);
    } catch (error: any) {
      toast.error('Failed to fetch images: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery, filterOptions, sortBy, sortDirection]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleImageClick = (image: ImageInfo, e: React.MouseEvent) => {
    if (e.altKey) {
      setEditingImage(image);
      return;
    }

    if (!multiSelect) {
      onImageSelect?.(image);
      return;
    }

    const newSelected = new Set(selectedImages);
    if (newSelected.has(image.public_id)) {
      newSelected.delete(image.public_id);
    } else {
      newSelected.add(image.public_id);
    }
    setSelectedImages(newSelected);
  };

  const handleOptimize = async (image: ImageInfo) => {
    if (processing.has(image.public_id)) return;

    try {
      setProcessing(prev => new Set([...prev, image.public_id]));
      const result = await cloudinaryService.optimizeAndWatermark(image.public_id);
      const updatedImage = await cloudinaryService.getImageInfo(image.public_id);
      setImages(prev => prev.map(img => 
        img.public_id === image.public_id ? updatedImage : img
      ));
      toast.success('Image optimized successfully!');
    } catch (error: any) {
      toast.error('Failed to optimize image: ' + error.message);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.public_id);
        return newSet;
      });
    }
  };

  const handleRestore = async (image: ImageInfo) => {
    if (processing.has(image.public_id)) return;

    try {
      setProcessing(prev => new Set([...prev, image.public_id]));
      await cloudinaryService.restoreImage(image.public_id);
      const updatedImage = await cloudinaryService.getImageInfo(image.public_id);
      setImages(prev => prev.map(img => 
        img.public_id === image.public_id ? updatedImage : img
      ));
      toast.success('Image restored successfully!');
    } catch (error: any) {
      toast.error('Failed to restore image: ' + error.message);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.public_id);
        return newSet;
      });
    }
  };

  const handleDelete = async (image: ImageInfo) => {
    if (processing.has(image.public_id)) return;

    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      setProcessing(prev => new Set([...prev, image.public_id]));
      await cloudinaryService.deleteWithBackup(image.public_id);
      setImages(prev => prev.filter(img => img.public_id !== image.public_id));
      toast.success('Image deleted successfully!');
    } catch (error: any) {
      toast.error('Failed to delete image: ' + error.message);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.public_id);
        return newSet;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedImages.size} images?`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedImages).map(publicId =>
          cloudinaryService.deleteWithBackup(publicId)
        )
      );
      setImages(prev => prev.filter(img => !selectedImages.has(img.public_id)));
      setSelectedImages(new Set());
      toast.success('Images deleted successfully!');
    } catch (error: any) {
      toast.error('Failed to delete some images: ' + error.message);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search images..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        
        <button
          onClick={() => setShowFilterModal(true)}
          className="p-2 text-gray-600 hover:text-gray-800"
          title="Filter"
        >
          <AiOutlineFilter className="text-xl" />
        </button>
        
        <button
          onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="p-2 text-gray-600 hover:text-gray-800"
          title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
        >
          {sortDirection === 'asc' ? <BsSortUp className="text-xl" /> : <BsSortDown className="text-xl" />}
        </button>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'size' | 'name')}
          className="p-2 border rounded-lg"
        >
          <option value="date">Date</option>
          <option value="size">Size</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <div
              key={image.public_id}
              className={`relative group ${
                selectedImages.has(image.public_id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={(e) => handleImageClick(image, e)}
            >
              <img
                src={image.secure_url}
                alt={image.public_id}
                className="w-full aspect-square object-cover rounded-lg shadow-md cursor-pointer transition-transform group-hover:scale-[1.02]"
              />
              
              {showActions && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptimize(image);
                    }}
                    disabled={processing.has(image.public_id)}
                    className="p-1.5 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                    title="Optimize"
                  >
                    <AiOutlineEdit className="text-sm" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(image);
                    }}
                    disabled={processing.has(image.public_id)}
                    className="p-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                    title="Restore"
                  >
                    <AiOutlineReload className="text-sm" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image);
                    }}
                    disabled={processing.has(image.public_id)}
                    className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                    title="Delete"
                  >
                    <AiOutlineDelete className="text-sm" />
                  </button>
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-xs rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="truncate">{image.public_id}</p>
                <p>{(image.bytes / 1024 / 1024).toFixed(2)} MB</p>
                <p>{new Date(image.created_at).toLocaleDateString()}</p>
                <p className="text-gray-300 mt-1">Alt + Click to edit</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Filter Images</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  placeholder="Enter tags (comma separated)"
                  value={filterOptions.tags.join(', ')}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  }))}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Format</label>
                <select
                  value={filterOptions.format}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    format: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All</option>
                  <option value="jpg">JPG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                  <option value="gif">GIF</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Size</label>
                <select
                  value={filterOptions.size}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    size: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All</option>
                  <option value="0-1">Under 1MB</option>
                  <option value="1-5">1-5MB</option>
                  <option value="5-10">5-10MB</option>
                  <option value="10-999">Over 10MB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <select
                  value={filterOptions.date}
                  onChange={(e) => setFilterOptions(prev => ({
                    ...prev,
                    date: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">All Time</option>
                  <option value="1">Last 24 Hours</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setFilterOptions({
                    tags: [],
                    format: '',
                    size: '',
                    date: ''
                  });
                  setShowFilterModal(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {multiSelect && selectedImages.size > 0 && (
        <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {editingImage && (
        <ImageEditor
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onSave={(updatedImage) => {
            setImages(prev => prev.map(img => 
              img.public_id === updatedImage.public_id ? updatedImage : img
            ));
            setEditingImage(null);
          }}
        />
      )}
    </div>
  );
};

export default ImageGallery;
