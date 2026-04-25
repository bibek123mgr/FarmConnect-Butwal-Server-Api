import jwt from "jsonwebtoken";
import { config } from "../config/index";

const JWT_SECRET: jwt.Secret = config.JWT_SECRET as jwt.Secret;
const JWT_EXPIRES_IN = (config.JWT_EXPIRES_IN ?? "1d") as jwt.SignOptions["expiresIn"];


interface JwtPayload {
    id: number;
    role?: string;
    farmId?: number
}

class JwtHelper {
    static generateToken(payload: JwtPayload) {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
    }

    static generateRefreshToken(payload: JwtPayload) {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: "7d",
        });
    }

    static verifyToken(token: string) {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    }

    static decodeToken(token: string) {
        return jwt.decode(token) as JwtPayload | null;
    }
}

export default JwtHelper;