import { Request, Response, NextFunction } from "express";
import JwtHelper from "../helper/jwtHepler";

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email?: string;
        role?: string;
    };
}

export const Auth = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                status: "error",
                message: "No token provided",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Invalid token format",
            });
        }

        const decoded = JwtHelper.verifyToken(token);

        req.user = decoded;

        return next();
    } catch (error) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized",
        });
    }
};