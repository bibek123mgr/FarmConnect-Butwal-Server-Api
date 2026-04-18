import Joi from "joi";

class BaseValidation {
    public static getString(requiredMsg: string = "Field is required") {
        return Joi.string().trim().required().messages({
            "string.empty": requiredMsg,
            "any.required": requiredMsg,
        });
    }

    public static getOptionalString() {
        return Joi.string().trim().allow(null, "").optional();
    }

    public static getNumber(requiredMsg: string = "Field is required") {
        return Joi.number().required().messages({
            "any.required": requiredMsg,
            "number.base": "Must be a number",
        });
    }

    public static getPositiveNumber(requiredMsg: string = "Field is required") {
        return Joi.number().positive().required().messages({
            "any.required": requiredMsg,
            "number.base": "Must be a number",
            "number.positive": "Must be greater than 0",
        });
    }

    public static getOptionalNumber() {
        return Joi.number().allow(null, "").optional();
    }

    public static getBoolean() {
        return Joi.boolean().optional();
    }
}

export default BaseValidation;