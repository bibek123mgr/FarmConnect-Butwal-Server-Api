import Joi from "joi";

class BaseValidation {
    public static getString(requiredMsg: string = "Field is required") {
        return Joi.string().trim().required().messages({
            "string.empty": requiredMsg,
        });
    }

    public static getOptionalString() {
        return Joi.string().trim().allow(null, "").optional();
    }

    public static getBoolean() {
        return Joi.boolean().optional();
    }
}

class FarmValidation {
    public static createFarmSchema = Joi.object({
        farmName: BaseValidation.getString("Farm name is required").max(150),
        description: BaseValidation.getOptionalString().max(500),
        province: BaseValidation.getOptionalString().max(100),
        district: BaseValidation.getOptionalString().max(100),
        address: BaseValidation.getOptionalString().max(255),
        logo: BaseValidation.getOptionalString(),
        panNo: BaseValidation.getOptionalString().max(50),
        vatNo: BaseValidation.getOptionalString().max(50),
    });

    public static updateFarmSchema = Joi.object({
        farmName: BaseValidation.getOptionalString().max(150),
        description: BaseValidation.getOptionalString().max(500),
        province: BaseValidation.getOptionalString().max(100),
        district: BaseValidation.getOptionalString().max(100),
        address: BaseValidation.getOptionalString().max(255),
        logo: BaseValidation.getOptionalString(),
        panNo: BaseValidation.getOptionalString().max(50),
        vatNo: BaseValidation.getOptionalString().max(50),
        isActive: BaseValidation.getBoolean(),
        isVerified: BaseValidation.getBoolean(),
    });
}

export default FarmValidation;