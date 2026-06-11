// routes/recommendationRoutes.ts

import { Router, Request, Response } from 'express';
import recommendationController from '../controllers/RecommendationController';

const router = Router();

/**
 * ═══════════════════════════════════════════════════════════════════
 * COLLABORATIVE FILTERING ROUTES
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * GET /api/recommendations/:userId
 * Get collaborative filtering recommendations for a specific user
 * 
 * Query Parameters:
 *   - limit (optional): Number of recommendations (default: 5)
 * 
 * Example: /api/recommendations/1?limit=8
 */
router.get(
  '/recommendations/:userId',
  (req: Request, res: Response) =>
    recommendationController.getRecommendations(req, res)
);

/**
 * GET /api/recommendations/:userId/details
 * Get detailed recommendation analysis with metrics
 * 
 * Example: /api/recommendations/1/details
 */
router.get(
  '/recommendations/:userId/details',
  (req: Request, res: Response) =>
    recommendationController.getRecommendationDetails(req, res)
);

/**
 * ═══════════════════════════════════════════════════════════════════
 * MARKET BASKET ANALYSIS ROUTES
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * GET /api/products/:productId/market-basket-analysis
 * Market Basket Analysis - Find frequently bought together products
 * 
 * Query Parameters:
 *   - limit (optional): Number of recommendations (default: 5)
 *   - optimized (optional): Use optimized SQL query (default: false)
 * 
 * Example: /api/products/5/market-basket-analysis?limit=8&optimized=true
 */
router.get(
  '/products/:productId/market-basket-analysis',
  (req: Request, res: Response) =>
    recommendationController.getMarketBasketAnalysis(req, res)
);



export default router;