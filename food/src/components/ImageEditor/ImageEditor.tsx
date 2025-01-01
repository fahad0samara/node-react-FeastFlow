import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { cloudinaryService, ImageInfo, TransformationOptions } from '../../services/cloudinaryService';
import { AiOutlineSave, AiOutlineUndo, AiOutlineRedo, AiOutlineClose } from 'react-icons/ai';
import { BsAspectRatio, BsBrightnessHigh, BsContrast } from 'react-icons/bs';
import { MdOutlineRotate90DegreesCcw, MdCrop, MdOutlinePhotoFilter } from 'react-icons/md';
import { FaCompress } from 'react-icons/fa';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface ImageEditorProps {
  image: ImageInfo;
  onClose: () => void;
  onSave: (updatedImage: ImageInfo) => void;
}

interface EditState {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  quality: number;
  rotation: number;
  width: number;
  height: number;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ image, onClose, onSave }) => {
  const [editState, setEditState] = useState<EditState>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0,
    quality: 90,
    rotation: 0,
    width: image.width,
    height: image.height,
    crop: null
  });

  const [previewUrl, setPreviewUrl] = useState(image.secure_url);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<EditState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    // Add initial state to history
    setHistory([editState]);
    setHistoryIndex(0);
  }, []);

  const addToHistory = (newState: EditState) => {
    const newHistory = [...history.slice(0, historyIndex + 1), newState];
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEditState(history[historyIndex - 1]);
      updatePreview(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEditState(history[historyIndex + 1]);
      updatePreview(history[historyIndex + 1]);
    }
  };

  const updatePreview = async (state: EditState) => {
    try {
      const options: TransformationOptions = {
        width: state.width,
        height: state.height,
        crop: state.crop ? 'crop' : 'scale',
        quality: state.quality.toString(),
        effect: `brightness:${state.brightness},contrast:${state.contrast},saturation:${state.saturation},blur:${state.blur}`
      };

      if (state.rotation !== 0) {
        options.effect += `,angle:${state.rotation}`;
      }

      const result = await cloudinaryService.optimizeImage(image.public_id, options);
      setPreviewUrl(result.url);
    } catch (error: any) {
      toast.error('Failed to update preview: ' + error.message);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const options: TransformationOptions = {
        width: editState.width,
        height: editState.height,
        crop: editState.crop ? 'crop' : 'scale',
        quality: editState.quality.toString(),
        effect: `brightness:${editState.brightness},contrast:${editState.contrast},saturation:${editState.saturation},blur:${editState.blur}`
      };

      if (editState.rotation !== 0) {
        options.effect += `,angle:${editState.rotation}`;
      }

      const result = await cloudinaryService.optimizeImage(image.public_id, options);
      const updatedImage = await cloudinaryService.getImageInfo(image.public_id);
      onSave(updatedImage);
      toast.success('Image saved successfully!');
    } catch (error: any) {
      toast.error('Failed to save image: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof EditState, value: number) => {
    const newState = { ...editState, [key]: value };
    setEditState(newState);
    addToHistory(newState);
    updatePreview(newState);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Image</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <AiOutlineClose className="text-xl" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="relative aspect-square">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* History Controls */}
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                title="Undo"
              >
                <AiOutlineUndo />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                title="Redo"
              >
                <AiOutlineRedo />
              </button>
            </div>

            {/* Adjustments */}
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <BsBrightnessHigh /> Brightness
                </label>
                <Slider
                  min={-100}
                  max={100}
                  value={editState.brightness}
                  onChange={(value) => handleChange('brightness', value as number)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <BsContrast /> Contrast
                </label>
                <Slider
                  min={-100}
                  max={100}
                  value={editState.contrast}
                  onChange={(value) => handleChange('contrast', value as number)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <MdOutlinePhotoFilter /> Saturation
                </label>
                <Slider
                  min={-100}
                  max={100}
                  value={editState.saturation}
                  onChange={(value) => handleChange('saturation', value as number)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <FaCompress /> Quality
                </label>
                <Slider
                  min={1}
                  max={100}
                  value={editState.quality}
                  onChange={(value) => handleChange('quality', value as number)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <MdOutlineRotate90DegreesCcw /> Rotation
                </label>
                <Slider
                  min={0}
                  max={360}
                  value={editState.rotation}
                  onChange={(value) => handleChange('rotation', value as number)}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <BsAspectRatio /> Dimensions
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editState.width}
                    onChange={(e) => handleChange('width', parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                    placeholder="Width"
                  />
                  <span className="text-gray-500">×</span>
                  <input
                    type="number"
                    value={editState.height}
                    onChange={(e) => handleChange('height', parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                    placeholder="Height"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <AiOutlineSave />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
