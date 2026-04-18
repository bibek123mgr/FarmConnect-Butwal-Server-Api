import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

export const validate = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body);
        console.log(req.body);

        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                status: false,
                message: 'Validation error',
                errors
            });
        }

        return next();
    };
};