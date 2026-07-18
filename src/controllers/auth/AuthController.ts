import { Request, Response } from "express";
import AuthService from "../../services/auth/AuthService";
import { asyncHandler } from "../../utils/asyncHandler";
import redisClient from "../../redis/redis";
import JwtHelper from "../../helper/jwtHepler";
import { AuthRequest } from "../../middlewares/Auth";
import { config } from "../../config/index"
import { OAuth2Client } from "google-auth-library";
const googleClient = new OAuth2Client(config.GOOGLEOAUTH_CLIENT_ID!);

class AuthController {
    static registerWithGoogleOrLogin = asyncHandler(async (req: Request, res: Response) => {
        const { credentials } = req.body;
        const ticket = await googleClient.verifyIdToken({
            idToken: credentials,
            audience: config.GOOGLEOAUTH_CLIENT_ID
        });
        const payload = ticket.getPayload();
        console.log(payload);
        if (!payload) {
            return res.status(400).json({
                status: false,
                message: "Invalid Google token"
            });
        }
        const email = payload.email;
        const name = payload.name;
        const googleId = payload.sub;
        if (!email || !name || !googleId) {
            return res.status(400).json({
                status: false,
                message: "Missing required user information from Google"
            });
        }
        const password = "";
        const data = await AuthService.loginWithGoogleOrSignUp({ email, name, googleId, password });
        if (!data) {
            return res.status(400).json({
                status: false,
                message: "User Already Exists"
            });
        }
        const { user, token, refreshToken } = data;

        res.cookie("accessToken", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/"
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/"
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
            secure: false,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/"
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/"
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
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        await redisClient.del(`refresh-token:users:${userId}`);
        await redisClient.del(`user:profile:${userId}`);
        return res.status(200).json({
            status: true,
            message: "Logout successful"
        });
    });

    static me = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id as number;
        const user = await AuthService.getUserById(userId);
        return res.status(200).json({
            status: true,
            user
        });
    });

    static getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
        const users = await AuthService.getAllUsers();
        return res.status(200).json({
            status: true,
            users
        });
    });

    static getDashboardStatic = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id as number;
        const data = await AuthService.getDashbaordStatic();
        return res.status(200).json({
            status: true,
            data
        });
    });


    static updateUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id as number;
        const data = req.body;
        
        const jsonObject = {
            ...data,
            id: userId
        }

        console.log(jsonObject);
        const updatedUser = await AuthService.updateUserProfile(jsonObject);
        return res.status(200).json({
            status: true,
            message: "User profile updated successfully",
            user: updatedUser
        });
    }
    );

    static updateUserPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
        const userId = req.user?.id as number;
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if(!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        }
        if(newPassword !== confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "New password and confirm password do not match"
            });
        }
    
        const updatedUser = await AuthService.updateUserPassword(userId, oldPassword, newPassword);
        return res.status(200).json({
            status: true,
            message: "User password updated successfully",
            user: updatedUser
        });
    }
    );

}

export default AuthController;