import Joi from "joi";
import BaseValidation from "./BaseValidation";

class DamageValidation {

    static create = Joi.object({
        productId: BaseValidation.getPositiveNumber("Product is required"),
        quantity: BaseValidation.getPositiveNumber("Quantity must be greater than 0"),
        remarks: BaseValidation.getOptionalString()
    });

}

export default DamageValidation;