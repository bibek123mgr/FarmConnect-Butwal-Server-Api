import { Response } from 'express';

export class ApiResponse {
    static success(res: Response, data: any, message: string = 'Success', statusCode: number = 200) {
        return res.status(statusCode).json({
            status: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    static successWithToken(res: Response, token: string, message: string = 'Success', statusCode: number = 200) {
        return res.status(statusCode).json({
            status: true,
            message,
            token,
            timestamp: new Date().toISOString()
        });
    }

    static error(res: Response, message: string, statusCode: number = 500, error?: any) {
        const response: any = {
            status: false,
            message,
            timestamp: new Date().toISOString()
        };
        
        if (error && process.env.NODE_ENV === 'development') {
            response.error = error.message;
        }
        
        return res.status(statusCode).json(response);
    }
}