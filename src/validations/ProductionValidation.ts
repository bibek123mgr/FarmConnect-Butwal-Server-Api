import Joi from "joi";
import BaseValidation from "./BaseValidation";

class ProductionValidation {

    static create = Joi.object({
        productId: BaseValidation.getPositiveNumber("Product is required"),
        quantity: BaseValidation.getPositiveNumber("Quantity must be greater than 0"),
        rate: BaseValidation.getOptionalNumber(),
        remarks: BaseValidation.getOptionalString()
    });

}

export default ProductionValidation;