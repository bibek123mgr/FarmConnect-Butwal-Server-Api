import { NextFunction, Request, Response } from "express";
import Joi from "joi";

class BaseValidation {
    public static getString(requiredMsg: string = "Field is required") {
        return Joi.string().required().messages({
            "string.empty": requiredMsg,
        });
    }

    public static getOptionalString() {
        return Joi.string().allow(null, "").optional();
    }

    public static getBoolean() {
        return Joi.boolean().optional();
    }
}

const createFarmSchema = Joi.object({
    farmName: BaseValidation.getString("Farm name is required"),
    description: BaseValidation.getOptionalString(),
    province: BaseValidation.getOptionalString(),
    district: BaseValidation.getOptionalString(),
    address: BaseValidation.getOptionalString(),
    logo: BaseValidation.getOptionalString(),
    panNo: BaseValidation.getOptionalString(),
    vatNo: BaseValidation.getOptionalString(),
});

const updateFarmSchema = Joi.object({
    farmName: Joi.string().optional(),
    description: BaseValidation.getOptionalString(),
    province: BaseValidation.getOptionalString(),
    district: BaseValidation.getOptionalString(),
    address: BaseValidation.getOptionalString(),
    logo: BaseValidation.getOptionalString(),
    panNo: BaseValidation.getOptionalString(),
    vatNo: BaseValidation.getOptionalString(),
    isActive: BaseValidation.getBoolean(),
    isVerified: BaseValidation.getBoolean(),
});

class FarmValidation {
    static create(req: Request, res: Response, next: NextFunction) {
        const { error } = createFarmSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                status: false,
                errors: error.details.map((e) => e.message),
            });
        }

        return next();
    }

    static update(req: Request, res: Response, next: NextFunction) {
        const { error } = updateFarmSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                status: false,
                errors: error.details.map((e) => e.message),
            });
        }

        return next();
    }
}

export default FarmValidation;