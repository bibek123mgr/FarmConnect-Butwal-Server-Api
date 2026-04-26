import { NextFunction, Response } from "express";
import { AuthRequest } from "./Auth";

const authorizeRoles = async (...allowedRoles: string[]) => {

    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({
                status: "error",
                message: "Forbidden: You don't have permission to access this resource",
            });
        }

        return next();
    };

}

export default authorizeRoles;