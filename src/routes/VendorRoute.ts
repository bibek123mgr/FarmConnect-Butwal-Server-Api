import { Router } from "express";
const router = Router();
import VendorController from "../controllers/farmer/VendorController";
import { Auth } from "../middlewares/Auth";

router
    .route("/vendors")
    .get(Auth, VendorController.getAllVendors)

export default router