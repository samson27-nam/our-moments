
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Photo from '../models/Photo.ts';
import { protect } from '../middleware/auth.ts';

const router = express.Router();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'our_moments',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif']
  } as any
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const photos = await Photo.find().populate('uploadedBy', 'name email').sort({ createdAt: -1 });
    res.json(photos);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Fixed: Cast protect and upload middleware to any to resolve RequestHandler type mismatch in Express router
router.post('/', protect as any, upload.single('photo') as any, async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const photo = await Photo.create({
      imageUrl: req.file.path,
      publicId: req.file.filename,
      caption: req.body.caption,
      uploadedBy: req.user.id
    });

    res.status(201).json(photo);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req: any, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    // Check ownership
    if (photo.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized delete' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(photo.publicId);
    
    // Delete from DB
    await Photo.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Moment deleted forever' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
