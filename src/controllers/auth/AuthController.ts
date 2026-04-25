import { Request, Response } from "express";
import AuthService from "../../services/auth/AuthService";
import { asyncHandler } from "../../utils/asyncHandler";
import redisClient from "../../redis/redis";
import JwtHelper from "../../helper/jwtHepler";
import { AuthRequest } from "../../middlewares/Auth";

class AuthController {
    static register = asyncHandler(async (req: Request, res: Response) => {
        const { name, email, password, role } = req.body;

        const { token } = await AuthService.registerUser({
            name,
            email,
            password,
            role,
        });

        return res.status(201).json({
            status: true,
            message: "User registered successfully",
            token
        });
    });

    static login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        const { token, refreshToken, user } = await AuthService.loginUser(email, password);

        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        await redisClient.set(
            `refresh-token:users:${user.id}`,
            refreshToken,
            "EX",
            604800
        );
        return res.status(200).json({
            status: true,
            message: "Login successful",
            token
        });
    });

    static refreshToken = asyncHandler(async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                status: false,
                message: "Refresh token missing"
            });
        }
        const decoded = JwtHelper.verifyToken(refreshToken);
        const storedToken = await redisClient.get(`refresh-token:users:${decoded.id}`);
        if (storedToken !== refreshToken) {
            return res.status(401).json({
                status: false,
                message: "Invalid refresh token"
            });
        }
        const user = {
            id: decoded.id,
            role: decoded.role,
            farmId: decoded.farmId
        };
        const newToken = AuthService.generateAuthToken(user);
        res.cookie("accessToken", newToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000
        });
        return res.status(200).json({
            status: true,
            message: "Token refreshed successfully",
        });
    });

    static logout = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id;
        if (userId) {
            await redisClient.del(`refresh-token:users:${userId}`);
        }
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        await redisClient.del(`refresh-token:users:${userId}`);
        return res.status(200).json({
            status: true,
            message: "Logout successful"
        });
    });

}

export default AuthController;