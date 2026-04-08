import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { mediaRootDirectory } from "../utils/media.js";

const Router = express.Router();

// Fixed blog image dimensions
const BLOG_IMAGE_WIDTH = 800;
const BLOG_IMAGE_HEIGHT = 480;

const blogUploadsDir = path.join(mediaRootDirectory, "blog");
if (!fs.existsSync(blogUploadsDir)) {
  fs.mkdirSync(blogUploadsDir, { recursive: true });
}

// Multer config - store in memory for sharp processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, png, gif, webp) are allowed"));
    }
  },
});

// Upload and resize blog image to fixed 800x480
Router.post("/blog/upload-image", upload.single("blogImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No image file provided" });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = ".jpg"; // Always output as jpg for consistency
    const filename = `editor-${timestamp}${ext}`;
    const outputPath = path.join(blogUploadsDir, filename);

    // Resize with sharp to exact fixed dimensions
    await sharp(req.file.buffer)
      .resize(BLOG_IMAGE_WIDTH, BLOG_IMAGE_HEIGHT, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    res.json({
      success: true,
      data: {
        filename,
        width: BLOG_IMAGE_WIDTH,
        height: BLOG_IMAGE_HEIGHT,
        key: filename,
        url: `/media/blog/${filename}`,
      },
    });
  } catch (error) {
    console.error("Blog image upload error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get blog image size requirements
Router.get("/blog/image-requirements", (req, res) => {
  res.json({
    success: true,
    data: {
      width: BLOG_IMAGE_WIDTH,
      height: BLOG_IMAGE_HEIGHT,
      maxFileSize: "10MB",
      allowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
      note: "All uploaded images will be automatically resized to 800x480px",
    },
  });
});

export default Router;
