import Joi from "joi";

class BaseValidation {
    public static getPositiveNumber(message: string) {
        return Joi.number().positive().required().messages({
            "number.base": message,
            "number.positive": message,
            "number.required": message,
        });
    }

    public static getString(message: string) {
        return Joi.string().required().messages({
            "string.empty": message,
            "any.required": message,
        });
    }

    public static getNumber(message: string) {
        return Joi.number().required().messages({
            "number.base": message,
            "any.required": message,
        });
    }
}

class CommentValidation {
    public static create = Joi.object({
        productId: BaseValidation.getString("Product is required"),
        rating: BaseValidation.getPositiveNumber("Rating is required"),
        comment: BaseValidation.getString("Comment is required"),
    });

    public static update = Joi.object({
        rating: BaseValidation.getPositiveNumber("Rating is required"),
        comment: BaseValidation.getString("Comment is required"),
    });
}

export default CommentValidation;