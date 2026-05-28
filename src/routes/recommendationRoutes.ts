// routes/recommendationRoutes.ts

import { Router, Request, Response } from 'express';
import recommendationController from '../controllers/RecommendationController';

const router = Router();

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
 * POST /api/recommendations/compare-users
 * Compare similarity between two users
 * 
 * Body:
 *   - userId1: number
 *   - userId2: number
 */
router.post(
  '/recommendations/compare-users',
  (req: Request, res: Response) => recommendationController.compareUsers(req, res)
);

export default router;