import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { Router } from 'express';
import { Menu } from '../models/Menu';
import dotenv from 'dotenv';
import { Request, Response } from 'express';

dotenv.config();

const router = Router();

interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
  effect?: string;
  watermark?: boolean;
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// File filter function with enhanced validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed!'));
  }

  // Check mime type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'));
  }

  cb(null, true);
};

// Configure Cloudinary storage with advanced options
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    const category = req.body?.category || 'uncategorized';
    const timestamp = Date.now();
    const uniqueSuffix = Math.round(Math.random() * 1E9);
    let tagString = 'menu-item';
    
    if (req.body?.tags) {
      tagString = `menu-item,${req.body.tags}`;
    }

    return {
      folder: `menu-items/${category}`,
      format: 'auto',
      public_id: `${category}-${timestamp}-${uniqueSuffix}`,
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' },
        { effect: 'auto_contrast' },
        { effect: 'auto_brightness' }
      ],
      tags: tagString,
      resource_type: 'auto',
      backup: true
    };
  }
});

// Create multer upload instance with enhanced options
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Helper function to apply watermark
const applyWatermark = async (publicId: string) => {
  return cloudinary.uploader.explicit(publicId, {
    type: 'upload',
    transformation: [
      { overlay: 'restaurant_logo', // Your logo public_id
        gravity: 'southeast',
        x: 10,
        y: 10,
        opacity: 50
      }
    ]
  });
};

// Helper function to optimize image
const optimizeImage = async (publicId: string, options: TransformationOptions) => {
  const transformation: any = {
    width: options.width || 'auto',
    height: options.height || 'auto',
    crop: options.crop || 'limit',
    quality: options.quality || 'auto',
    format: options.format || 'auto',
    fetch_format: 'auto',
    effect: options.effect || 'auto_contrast'
  };

  if (options.watermark) {
    transformation.overlay = 'restaurant_logo';
    transformation.gravity = 'southeast';
    transformation.x = 10;
    transformation.y = 10;
    transformation.opacity = 50;
  }

  return cloudinary.url(publicId, { transformation });
};

// Upload single image with enhanced features
router.post('/menu', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const file = req.file as any;
    let imageUrl = file.path;

    // Create a backup of the original image
    await cloudinary.uploader.upload(file.path, {
      public_id: `${file.filename}_backup`,
      resource_type: 'auto',
      backup: true
    });

    // Apply watermark if requested
    if (req.body.watermark === 'true') {
      const watermarked = await applyWatermark(file.filename);
      imageUrl = watermarked.secure_url;
    }

    const newItem = new Menu({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      price: req.body.price,
      image: imageUrl,
      tags: req.body.tags ? req.body.tags.split(',').map((tag: string) => tag.trim()) : []
    });

    const savedItem = await newItem.save();
    res.json(savedItem);
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
});

// Bulk upload with progress tracking
router.post('/menu/bulk', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const files = req.files as Express.Multer.File[];
    const results = await Promise.all(files.map(async (file: any) => {
      try {
        let imageUrl = file.path;
        
        // Create a backup of the original image
        await cloudinary.uploader.upload(file.path, {
          public_id: `${file.filename}_backup`,
          resource_type: 'auto',
          backup: true
        });

        if (req.body.watermark === 'true') {
          const watermarked = await applyWatermark(file.filename);
          imageUrl = watermarked.secure_url;
        }

        return {
          success: true,
          originalName: file.originalname,
          url: imageUrl,
          publicId: file.filename
        };
      } catch (error: any) {
        return {
          success: false,
          originalName: file.originalname,
          error: error.message
        };
      }
    }));

    res.json({
      totalUploaded: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      details: results
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Bulk upload failed', 
      message: error.message 
    });
  }
});

// Delete image
router.delete('/menu/:publicId', async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    
    // Delete both original and backup
    await Promise.all([
      cloudinary.uploader.destroy(publicId),
      cloudinary.uploader.destroy(`${publicId}_backup`)
    ]);

    // Delete from database if exists
    await Menu.findOneAndDelete({ image: new RegExp(publicId) });

    res.json({ message: 'Image and backup deleted successfully' });
  } catch (error: any) {
    res.status(500).json({
      error: 'Delete failed',
      message: error.message
    });
  }
});

// Get optimized image URL
router.get('/menu/:publicId/optimize', async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    const options: TransformationOptions = {
      width: req.query.width ? parseInt(req.query.width as string) : undefined,
      height: req.query.height ? parseInt(req.query.height as string) : undefined,
      crop: req.query.crop as string,
      quality: req.query.quality as string,
      format: req.query.format as string,
      effect: req.query.effect as string,
      watermark: req.query.watermark === 'true'
    };

    const optimizedUrl = await optimizeImage(publicId, options);
    res.json({ url: optimizedUrl });
  } catch (error: any) {
    res.status(500).json({
      error: 'Optimization failed',
      message: error.message
    });
  }
});

// Search images by tag
router.get('/menu/tags/:tags', async (req: Request, res: Response) => {
  try {
    const tags = req.params.tags.split(',');
    const result = await cloudinary.api.resources_by_tag(tags[0]); // Cloudinary only accepts a single tag
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Tag search failed', 
      message: error.message 
    });
  }
});

// Restore from backup
router.post('/menu/:publicId/restore', async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    const backupId = `${publicId}_backup`;

    // Check if backup exists
    const backup = await cloudinary.api.resource(backupId);
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // Copy backup to original
    const result = await cloudinary.uploader.rename(backupId, publicId, { overwrite: true });

    // Update menu item if exists
    await Menu.findOneAndUpdate(
      { image: new RegExp(publicId) },
      { image: result.secure_url }
    );

    res.json({ message: 'Image restored from backup', result });
  } catch (error: any) {
    res.status(500).json({
      error: 'Restore failed',
      message: error.message
    });
  }
});

// Get image info
router.get('/menu/:publicId/info', async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    const result = await cloudinary.api.resource(publicId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get image info',
      message: error.message
    });
  }
});

// List all images
router.get('/menu', async (req: Request, res: Response) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'menu-items/',
      max_results: 500
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to list images',
      message: error.message
    });
  }
});

export default router;
