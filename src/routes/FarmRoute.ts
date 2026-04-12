import { Router } from 'express';
const router = Router();

import FarmController from '../controllers/farmer/FarmController';
import { Auth } from '../middlewares/Auth';
import FarmValidation from '../validations/FarmValidation';
import { validate } from '../utils/validation.middleware';

// router
//     .route("/farms")
//     .post(Auth, validate(FarmValidation.createFarmSchema), FarmController.create)
//     .get(Auth, FarmController.getAll)
//     .put(Auth, validate(FarmValidation.updateFarmSchema), FarmController.update);


router
    .route("/register")
    .post(Auth, validate(FarmValidation.createFarmSchema), FarmController.create);


// router
//     .route("farms/:id")
//     .get(Auth, FarmController.getById)
//     .delete(Auth, FarmController.delete);

export default router;  
