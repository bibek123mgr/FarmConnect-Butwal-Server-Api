import Joi from "joi";
import BaseValidation from "./BaseValidation";

class DamageValidation {

    static create = Joi.object({
        productId: BaseValidation.getPositiveNumber("Product is required"),
        farmId: BaseValidation.getPositiveNumber("Farm is required"),
        quantity: BaseValidation.getPositiveNumber("Quantity must be greater than 0"),

        reason: Joi.string()
            .valid("WEATHER", "PEST", "TRANSPORT", "STORAGE", "EXPIRED", "OTHER")
            .required()
            .messages({
                "any.only": "Invalid damage reason",
                "any.required": "Reason is required"
            }),

        lossAmount: BaseValidation.getOptionalNumber(),
        remarks: BaseValidation.getOptionalString()
    });

}

export default DamageValidation;