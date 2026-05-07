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

    public static getNumber(requiredMsg: string = "Field is required") {
        return Joi.number().required().messages({
            "string.empty": requiredMsg,
        });
    }

    public static getOptionalNumber() {
        return Joi.number().allow(null, "").optional();
    }

    public static getBoolean() {
        return Joi.boolean().optional();
    }
}

class ProductValidation {

    public static create = Joi.object({
        name: BaseValidation.getString("Product name is required"),
        description: BaseValidation.getOptionalString(),
        rate: BaseValidation.getNumber("Product price is required"),
        unit: BaseValidation.getString("Product unit is required"),
        quantity: BaseValidation.getNumber("Product quantity is required"),
        categoryId: BaseValidation.getNumber("Product category is required")
    })

    public static update = Joi.object({
        name: BaseValidation.getOptionalString(),
        description: BaseValidation.getOptionalString(),
        rate: BaseValidation.getOptionalNumber(),
        unit: BaseValidation.getOptionalString(),
        quantity: BaseValidation.getOptionalNumber(),
        categoryId: BaseValidation.getNumber("Product category is required")
    })

    public static getAllProduct=Joi.object({
        productname: BaseValidation.getOptionalString(),
        categoryId: Joi.string().allow(null, ""),
        page: BaseValidation.getNumber("Page is required"),
        limit: BaseValidation.getNumber("Limit is required"),
        pricerangeFrom: Joi.number().allow(null, ""),
        pricerangeTo: Joi.string().allow(null, ""),
    })

    public static getAllProductForAdmin=Joi.object({
        productname: BaseValidation.getOptionalString(),
        categoryId: Joi.string().allow(null, ""),
        page: BaseValidation.getNumber("Page is required"),
        limit: BaseValidation.getNumber("Limit is required")
    })
}

export default ProductValidation