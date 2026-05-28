// controllers/RecommendationController.ts

import { Request, Response } from "express";
import collaborativeFilteringService from "../services/collaborativeFilteringService";

export interface UserSimilarity {
    userId: number;
    similarity: number;
    purchasedProducts: number[];
    purchaseCount: number;
}

export interface RecommendationScore {
    productId: number;
    recommendationScore: number;
}

export interface RecommendedProduct {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    rating: number;
    stock: number;
    recommendationScore: number;
    recommendationType: string;
}

export interface TopSimilarUser {
    userId: number;
    similarity: number;
    purchaseCount: number;
}

export interface CollaborativeFilteringResult {
    success: boolean;
    userId: number;
    algorithm: string;
    similarUsersConsidered: number;
    topSimilarUsers: TopSimilarUser[];
    recommendations: RecommendedProduct[];
    executionTime: number;
}

export interface ColdStartResult {
    success: boolean;
    algorithm: string;
    reason: string;
    recommendations: RecommendedProduct[];
}

export interface RecommendationResponse {
    success: boolean;
    error?: string;
    data?: CollaborativeFilteringResult | ColdStartResult | unknown;
}

export interface JaccardSimilarityResult {
    intersection: number[];
    intersectionCount: number;
    unionCount: number;
    similarity: number;
}

class RecommendationController {

    /**
     * Convert string | string[] to string safely
     */
    private getStringValue(value: string | string[] | undefined): string {
        if (Array.isArray(value)) {
            return value[0];
        }

        return value || "";
    }

    /**
     * GET /api/recommendations/:userId
     * Get collaborative filtering recommendations for a user
     */
    async getRecommendations(req: Request, res: Response): Promise<void> {
        try {
            const userId = this.getStringValue(req.params.userId);
            const limit = this.getStringValue(req.query.limit as string | string[]);

            // Validate input
            if (!userId || isNaN(Number(userId))) {
                res.status(400).json({
                    success: false,
                    error: "Valid userId is required",
                } as RecommendationResponse);

                return;
            }

            const parsedLimit = limit ? parseInt(limit, 10) : 5;

            // Get recommendations
            const result =
                await collaborativeFilteringService.getCollaborativeFilteringRecommendations(
                    parseInt(userId, 10),
                    parsedLimit
                );

            res.json({
                success: true,
                data: result,
            } as RecommendationResponse);

        } catch (error) {
            console.error("Error in getRecommendations:", error);

            res.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            } as RecommendationResponse);
        }
    }

    /**
     * GET /api/recommendations/:userId/details
     * Get detailed recommendation analysis
     */
    async getRecommendationDetails(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            const userId = this.getStringValue(req.params.userId);

            if (!userId || isNaN(Number(userId))) {
                res.status(400).json({
                    success: false,
                    error: "Valid userId is required",
                } as RecommendationResponse);

                return;
            }

            // Get recommendations
            const result =
                await collaborativeFilteringService.getCollaborativeFilteringRecommendations(
                    parseInt(userId, 10),
                    10
                );

            res.json({
                success: true,
                data: {
                    ...result,
                    metrics: {
                        algorithm: "collaborative_filtering",
                        timeComplexity: "O(U × P + U log U + K × P)",
                        spaceComplexity: "O(U × P)",
                        description:
                            "User-based collaborative filtering using Jaccard similarity",
                    },
                },
            } as RecommendationResponse);

        } catch (error) {
            console.error("Error in getRecommendationDetails:", error);

            res.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            } as RecommendationResponse);
        }
    }

    /**
     * POST /api/recommendations/compare-users
     * Compare similarity between two users
     */
    async compareUsers(req: Request, res: Response): Promise<void> {
        try {
            const { userId1, userId2 } = req.body;

            if (
                !userId1 ||
                !userId2 ||
                isNaN(Number(userId1)) ||
                isNaN(Number(userId2))
            ) {
                res.status(400).json({
                    success: false,
                    error: "Valid userId1 and userId2 are required",
                } as RecommendationResponse);

                return;
            }

            res.json({
                success: true,
                message: "User comparison feature coming soon",
            });

        } catch (error) {
            console.error("Error in compareUsers:", error);

            res.status(500).json({
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Internal server error",
            } as RecommendationResponse);
        }
    }
}

export default new RecommendationController();