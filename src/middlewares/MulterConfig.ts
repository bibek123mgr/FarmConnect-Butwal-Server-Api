import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadPath = path.join(__dirname, "../../public/images");

// create folder if not exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },

    filename: function (req, file, cb) {
        try {
            const ext = path.extname(file.originalname);

            const uniqueName =
                Date.now() +
                "-" +
                crypto.randomBytes(6).toString("hex") +
                ext;

            cb(null, uniqueName);
        } catch (error) {
            cb(error as Error, "");
        }
    },
});

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Only jpg, jpeg, png and webp images are allowed"));
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
    },
});