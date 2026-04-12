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

    public static getNumber() {
        return Joi.number().optional();
    }
}

class ProductCategoryValidation {
    public static createCategorySchema = Joi.object({
        name: BaseValidation.getString("Category name is required").max(150),
        slug: BaseValidation.getString("Slug is required").max(150),
        image: BaseValidation.getOptionalString(),
        sortOrder: BaseValidation.getNumber(),
    });

    public static updateCategorySchema = Joi.object({
        name: BaseValidation.getOptionalString().max(150),
        slug: BaseValidation.getOptionalString().max(150),
        image: BaseValidation.getOptionalString(),
        sortOrder: BaseValidation.getNumber(),
        isActive: BaseValidation.getBoolean(),
    });
}

export default ProductCategoryValidation;