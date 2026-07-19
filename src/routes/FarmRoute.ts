import { Router } from 'express';
const router = Router();

import FarmController from '../controllers/farmer/FarmController';
import { Auth } from '../middlewares/Auth';
import FarmValidation from '../validations/FarmValidation';
import { validate } from '../utils/validation.middleware';
import FarmRedisMiddleware from '../middlewares/FarmRedisMiddleware';
import { upload } from '../middlewares/MulterConfig';

// router
//     .route("/farms")
//     .post(Auth, validate(FarmValidation.createFarmSchema), FarmController.create)
//     .get(Auth, FarmController.getAll)
//     .put(Auth, validate(FarmValidation.updateFarmSchema), FarmController.update);


router
    .route("/register")
    .post(Auth, validate(FarmValidation.createFarmSchema),
        upload.single("image"),
        FarmController.create);

router
    .route("/top-farms")
    .get(
        FarmRedisMiddleware.getTopFarms(),
        FarmController.getTopFarms);

router
    .route("/farms")
    .get(
        FarmRedisMiddleware.getAll(),
        FarmController.getAll);


router.route("/my-farm")
    .get(
        Auth,
        FarmController.getById
    );



// router
//     .route("farms/:id")
//     .get(Auth, FarmController.getById)
//     .delete(Auth, FarmController.delete);

export default router;  
