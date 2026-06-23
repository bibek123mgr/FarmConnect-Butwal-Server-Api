import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { config } from "../config";
import multer from "multer";

/* ================= CLOUDINARY CONFIG ================= */
cloudinary.config({
    cloud_name: config.CLOUDNARY_KEY_NAME,
    api_key: config.CLOUDNARY_API_KEY,
    api_secret: config.CLOUDNARY_API_SECRET_KEY,
});

/* ================= UPLOAD FUNCTION ================= */
export const uploadToCloudinary = (file: Express.Multer.File) => {
    return new Promise((resolve, reject) => {
        if (!file) return reject(new Error("No file provided"));

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "farm_connect_products",
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
};

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});