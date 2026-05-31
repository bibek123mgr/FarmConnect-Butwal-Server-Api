import { Router } from "express";
const router = Router();
import VendorController from "../controllers/farmer/VendorController";
import { Auth } from "../middlewares/Auth";

router
    .route("/vendors")
    .get(Auth, VendorController.getAllVendors)

router
    .route("/vendors/stats")
    .get(Auth, VendorController.getStats)

export default router