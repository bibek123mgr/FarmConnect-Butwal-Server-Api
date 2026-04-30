import Joi from "joi";

class BaseValidation {
    public static getNumber(requiredMsg: string = "Field is required") {
        return Joi.number().required().messages({
            "number.base": "Must be a number",
            "any.required": requiredMsg,
        });
    }

    public static getOptionalNumber() {
        return Joi.number().optional();
    }

    public static getBoolean() {
        return Joi.boolean().optional();
    }
}

class CartValidation {
    public static addToCartSchema = Joi.object({
        productId: BaseValidation.getNumber("Product is required"),
        quantity: BaseValidation.getNumber("Quantity is required"),
        price: BaseValidation.getNumber("Price is required"),
    });

    public static updateCartSchema = Joi.object({
        quantity: BaseValidation.getOptionalNumber(),
        price: BaseValidation.getOptionalNumber(),
    });
}

export default CartValidation;