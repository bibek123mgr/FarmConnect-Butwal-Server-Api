import { NextFunction, Request, Response } from "express";
import Joi from "joi";

class BaseValidation {
    public static getEmail() {
        return Joi.string().email().required().messages({
            "string.empty": "Email is required",
            "string.email": "Invalid email format",
        });
    }

    public static getPassword() {
        return Joi.string().min(6).required().messages({
            "string.empty": "Password is required",
            "string.min": "Password must be at least 6 characters",
        });
    }

    public static getName() {
        return Joi.string().min(2).required().messages({
            "string.empty": "Name is required",
            "string.min": "Name must be at least 2 characters",
        });
    }
}

const registerSchema = Joi.object({
    name: BaseValidation.getName(),
    email: BaseValidation.getEmail(),
    password: BaseValidation.getPassword(),
});

const loginSchema = Joi.object({
    email: BaseValidation.getEmail(),
    password: BaseValidation.getPassword(),
});

const changePasswordSchema = Joi.object({
    oldPassword: BaseValidation.getPassword(),
    newPassword: Joi.string().min(6).required().messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 6 characters",
    }),
});

const forgotPasswordSchema = Joi.object({
    email: BaseValidation.getEmail(),
});

class AuthValidation {

    static register(req: Request, res: Response, next: NextFunction) {
        const { error } = registerSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                status: false,
                errors: error.details.map((e) => e.message),
            });
        }

        return next();
    }

    static login(req: Request, res: Response, next: NextFunction) {
        const { error } = loginSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                status: false,
                errors: error.details.map((e) => e.message),
            });
        }

        return next();
    }

    static changePassword(req: Request, res: Response, next: NextFunction) {
        const { error } = changePasswordSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                status: false,
                errors: error.details.map((e) => e.message),
            });
        }

        return next();
    }

    static forgotPassword(req: Request, res: Response, next: NextFunction) {
        const { error } = forgotPasswordSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                status: false,
                errors: error.details.map((e) => e.message),
            });
        }

        return next();
    }
}

export default AuthValidation;