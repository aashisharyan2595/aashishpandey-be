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

  const result = await new Promise<import("cloudinary").UploadApiResponse>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "aashishpandey", resource_type: "image" },
        (error, uploadResult) => {
          if (error || !uploadResult) return reject(error);
          resolve(uploadResult);
        }
      );
      stream.end(req.file!.buffer);
    }
  );

  const media = await MediaModel.create({
    url: result.secure_url,
    publicId: result.public_id,
    filename: req.file.originalname,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
  });

  return res.status(201).json(media);
}

export async function deleteMedia(req: Request, res: Response) {
  const media = await MediaModel.findById(req.params.id);
  if (!media) return res.status(404).json({ error: "Not found" });

  await cloudinary.uploader.destroy(media.publicId);
  await media.deleteOne();
  return res.status(204).send();
}
