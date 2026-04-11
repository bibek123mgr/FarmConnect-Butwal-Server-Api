import { Router } from 'express';
const router = Router();

import FarmController from '../controllers/farmer/FarmController';
import { Auth } from '../middlewares/Auth';
import FarmValidation from '../validations/FarmValidation';

router
    .route("/stores")
    .post(Auth, FarmValidation.create, FarmController.create)
    .get(Auth, FarmController.getAll)
    .put(Auth, FarmValidation.update, FarmController.update);

router
    .route("stores/:id")
    .get(Auth, FarmController.getById)
    .delete(Auth, FarmController.delete);

export default router;  
