import { Request, Response } from "express";
import AuthService from "../../services/auth/AuthService";
import { asyncHandler } from "../../utils/asyncHandler";

class AuthController {
    // Register user - NO try-catch needed!
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

    // Login user - NO try-catch needed!
    static login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        const { token } = await AuthService.loginUser(email, password);

        return res.status(200).json({
            status: true,
            message: "Login successful",
            token
        });
    });


}

export default AuthController;