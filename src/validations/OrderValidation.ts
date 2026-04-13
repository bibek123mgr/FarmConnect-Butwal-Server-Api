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

class OrderValidation {
    public static create = Joi.object({
        items: Joi.array()
            .items(
                Joi.object({
                    productId: BaseValidation.getPositiveNumber("Product is required"),
                    quantity: BaseValidation.getPositiveNumber("Quantity must be greater than 0"),
                    rate: BaseValidation.getPositiveNumber("Rate must be greater than 0"),
                    farmId: BaseValidation.getPositiveNumber("Farm is required"),
                })
            )
            .min(1)
            .required()
            .messages({
                "array.base": "Items must be an array",
                "array.min": "At least one product is required",
            }),

        paymentMethod: Joi.string()
            .valid("cod", "esewa", "khalti", "bank_transfer")
            .required()
            .messages({
                "any.only": "Invalid payment method",
                "any.required": "Payment method is required",
            }),
        address: BaseValidation.getString("Address is required"),
    });

    public static updateStatus = Joi.object({
        status: Joi.string()
            .valid("pending", "confirmed", "shipped", "delivered", "cancelled")
            .required()
            .messages({
                "any.only": "Invalid order status",
                "any.required": "Status is required",
            }),
    });

    public static getAll = Joi.object({
        status: Joi.string()
            .valid("pending", "confirmed", "shipped", "delivered", "cancelled")
            .optional(),
        fromDate: Joi.date().optional(),
        toDate: Joi.date().optional(),
    });
}

export default OrderValidation;