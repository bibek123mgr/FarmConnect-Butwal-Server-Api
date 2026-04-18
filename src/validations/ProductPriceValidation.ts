import Joi from "joi";
import BaseValidation from "./BaseValidation";

class ProductPriceValidation {

    static createOrUpdate = Joi.object({
        productId: BaseValidation.getPositiveNumber("Product is required"),
        farmId: BaseValidation.getPositiveNumber("Farm is required"),
        price: BaseValidation.getPositiveNumber("Price must be greater than 0"),

        type: Joi.string()
            .valid("FIXED", "DISCOUNT")
            .required(),

        title: BaseValidation.getOptionalString(),

        effectiveFrom: Joi.date().required(),

        effectiveTo: Joi.when("type", {
            is: "DISCOUNT",
            then: Joi.date().required(),
            otherwise: Joi.optional().allow(null)
        })
    });
}

export default ProductPriceValidation;