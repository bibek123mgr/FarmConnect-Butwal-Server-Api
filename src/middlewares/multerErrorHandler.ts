import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import multer from "multer";

export const multerErrorHandler: ErrorRequestHandler = (
    err,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File size exceeds limit",
            });
        }

        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    return res.status(400).json({
        success: false,
        message: err?.message || "Unknown error",
    });
};