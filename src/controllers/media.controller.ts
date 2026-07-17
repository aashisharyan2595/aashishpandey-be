import { Request, Response } from "express";
import { cloudinary } from "../config/cloudinary";
import { MediaModel } from "../models/Media";

export async function listMedia(_req: Request, res: Response) {
  const media = await MediaModel.find().sort({ createdAt: -1 }).limit(200);
  return res.json(media);
}

export async function uploadMedia(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const media = await uploadOne(req.file);
  return res.status(201).json(media);
}

async function uploadOne(file: Express.Multer.File) {
  const result = await new Promise<import("cloudinary").UploadApiResponse>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "aashishpandey", resource_type: "image" },
        (error, uploadResult) => {
          if (error || !uploadResult) return reject(error);
          resolve(uploadResult);
        }
      );
      stream.end(file.buffer);
    }
  );

  return MediaModel.create({
    url: result.secure_url,
    publicId: result.public_id,
    filename: file.originalname,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  });
}

export async function uploadMediaBulk(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const media = await Promise.all(files.map(uploadOne));
  return res.status(201).json(media);
}

export async function updateMedia(req: Request, res: Response) {
  const media = await MediaModel.findById(req.params.id);
  if (!media) return res.status(404).json({ error: "Not found" });

  if (typeof req.body.alt === "string") {
    media.alt = req.body.alt.slice(0, 300);
  }
  await media.save();
  return res.json(media);
}

export async function deleteMedia(req: Request, res: Response) {
  const media = await MediaModel.findById(req.params.id);
  if (!media) return res.status(404).json({ error: "Not found" });

  await cloudinary.uploader.destroy(media.publicId);
  await media.deleteOne();
  return res.status(204).send();
}
