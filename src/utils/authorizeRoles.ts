import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/Auth";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;
        if (!userRole) {
            throw new UnauthorizedError('Unauthorized');
        }
        if (!allowedRoles.includes(userRole)) {
            throw new ForbiddenError('Forbidden');
        }
        return next();
    };
};