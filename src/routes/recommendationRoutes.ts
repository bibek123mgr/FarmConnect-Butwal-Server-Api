import { Router } from "express";
import RecommendationController from "../controllers/RecommendationController";
import { Auth } from "../middlewares/Auth";

const router = Router();

/**
 * ═══════════════════════════════════════════════════════════════════
 * COLLABORATIVE FILTERING ROUTES
 * ═══════════════════════════════════════════════════════════════════
 */

router
    .route("/recommendations/:userId")
    .get(RecommendationController.getRecommendations);

router
    .route("/recommendations/:userId/details")
    .get(RecommendationController.getRecommendationDetails);

/**
 * ═══════════════════════════════════════════════════════════════════
 * MARKET BASKET ANALYSIS ROUTES
 * ═══════════════════════════════════════════════════════════════════
 */

router
    .route("/products/:productId/market-basket-analysis")
    .get(RecommendationController.getMarketBasketAnalysis);

router
    .route("/products/autocorrect-search")
    .get(RecommendationController.autocorrectSearch);

router
    .route("/products/demand-forecasting")
    .get(
      Auth,
      RecommendationController.demandForecasting);

export default router;