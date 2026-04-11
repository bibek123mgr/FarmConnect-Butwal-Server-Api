import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
    err: any,
    //@ts-ignore
    req: Request,
    res: Response,
    //@ts-ignore
    next: NextFunction
) => {

    // Handle AppError (our custom errors)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: false,
            message: err.message
        });
    }

    // Handle Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            status: false,
            message: err.errors[0]?.message || 'Duplicate entry found'
        });
    }

    // Handle Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            status: false,
            message: err.errors[0]?.message || 'Validation error'
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: false,
            message: 'Invalid token'
        });
    }

    // Default error
    return res.status(500).json({
        status: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
};