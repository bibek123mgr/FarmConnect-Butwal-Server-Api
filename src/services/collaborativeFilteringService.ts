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
    data?: CollaborativeFilteringResult | ColdStartResult;
}

export interface JaccardSimilarityResult {
    intersection: number[];
    intersectionCount: number;
    unionCount: number;
    similarity: number;
}

// services/CollaborativeFilteringService.ts

import { Op } from 'sequelize';
import Order from '../models/OrderModel';
import Product from '../models/ProductModel';
import User from '../models/UserModel';
import OrderItem from '../models/OrderItemModel';

class CollaborativeFilteringService {

    /**
     * JACCARD SIMILARITY ALGORITHM
     * Calculates similarity between two users based on purchased products
     * 
     * Formula: J(A,B) = |A ∩ B| / |A ∪ B|
     * 
     * @param userAProducts - Product IDs purchased by User A
     * @param userBProducts - Product IDs purchased by User B
     * @returns Similarity score (0 to 1)
     */
    private calculateJaccardSimilarity(
        userAProducts: number[],
        userBProducts: number[]
    ): JaccardSimilarityResult {
        // Convert arrays to Sets for O(1) lookup
        const setA = new Set<number>(userAProducts);
        const setB = new Set<number>(userBProducts);

        // Find intersection: products both users bought
        const intersection = [...setA].filter((product) => setB.has(product));

        // Find union: all unique products
        const union = new Set<number>([...setA, ...setB]);

        // Handle edge case: empty sets
        if (union.size === 0) {
            console.log('⚠️ Both users have no purchases - returning 0 similarity');
            return {
                intersection: [],
                intersectionCount: 0,
                unionCount: 0,
                similarity: 0,
            };
        }

        // Jaccard coefficient = intersection size / union size
        const similarity = intersection.length / union.size;

        console.log(`📊 Jaccard Similarity Calculation:
      - User A purchased: ${userAProducts.length} products
      - User B purchased: ${userBProducts.length} products
      - Common products: ${intersection.length}
      - Unique products total: ${union.size}
      - Similarity Score: ${(similarity * 100).toFixed(2)}%
    `);

        return {
            intersection,
            intersectionCount: intersection.length,
            unionCount: union.size,
            similarity,
        };
    }

    /**
     * STEP 1: Get current user's purchase history
     * Extracts all products purchased by the target user
     * 
     * @param userId - Target user ID
     * @returns Array of purchased product IDs
     */
    private async getUserPurchaseHistory(userId: number): Promise<number[]> {
        try {
            console.log(`\n[STEP 1] Fetching purchase history for User ${userId}...`);

            // Query: Get all products ordered by this user
            const purchasedItems = await OrderItem.findAll({
                where: { userId },
                attributes: ['productId'],
                include: [
                    {
                        model: Order,
                        attributes: [],
                        // where: {
                        //   // Only completed orders count
                        //   orderStatus: 'completed',
                        // },
                    },
                ],
                raw: true,
                subQuery: false,
            });

            // Extract unique product IDs
            const productIds: number[] = [
                ...new Set(purchasedItems.map((item: any) => item.productId)),
            ];

            console.log(`✅ User ${userId} has purchased ${productIds.length} unique products`);
            console.log(
                `   Product IDs: [${productIds
                    .slice(0, 5)
                    .join(', ')}${productIds.length > 5 ? '...' : ''}]`
            );

            return productIds;
        } catch (error) {
            console.error('❌ Error fetching user purchase history:', error);
            throw error;
        }
    }

    /**
     * STEP 2: Get all other users in the system
     * Fetches list of all users except the target user
     * 
     * @param userId - User ID to exclude
     * @returns Array of user objects with IDs
     */
    private async getAllOtherUsers(userId: number): Promise<User[]> {
        try {
            console.log(`\n[STEP 2] Finding all other users...`);

            // Query: Get all users who have made orders, except target user
            const otherUsers = await User.findAll({
                attributes: ['id'],
                where: {
                    id: { [Op.ne]: userId },
                },
                include: [
                    {
                        model: OrderItem,
                        attributes: [],
                        include: [
                            {
                                model: Order,
                                attributes: [],
                                // where: { orderStatus: 'completed' },
                            },
                        ],
                        required: true,
                    },
                ],
                raw: true,
                subQuery: false,
                group: ['User.id'],
            });

            console.log(`✅ Found ${otherUsers.length} other users in system`);

            return otherUsers;
        } catch (error) {
            console.error('❌ Error fetching other users:', error);
            throw error;
        }
    }

    /**
     * STEP 3: Calculate similarity with each user
     * Compares target user with all other users using Jaccard similarity
     * 
     * Time Complexity: O(U × P) where U = users, P = avg products per user
     * 
     * @param userId - Target user ID
     * @param userProductIds - Products purchased by target user
     * @param allOtherUsers - List of other users
     * @returns Sorted array of users with similarity scores
     */
    private async calculateUserSimilarities(
        userId: number,
        userProductIds: number[],
        allOtherUsers: User[]
    ): Promise<UserSimilarity[]> {
        try {
            console.log(`\n[STEP 3] Calculating similarity with ${allOtherUsers.length} users...`);

            const userSimilarities: UserSimilarity[] = [];

            // For each other user, calculate their similarity score
            for (const otherUser of allOtherUsers) {
                // Get this user's purchase history
                const otherUserProducts = await this.getUserPurchaseHistory(otherUser.id);

                // Skip if other user has no purchases
                if (otherUserProducts.length === 0) {
                    continue;
                }

                // Calculate Jaccard similarity
                const result = this.calculateJaccardSimilarity(
                    userProductIds,
                    otherUserProducts
                );

                // Only store users with meaningful similarity (> 0)
                if (result.similarity > 0) {
                    userSimilarities.push({
                        userId: otherUser.id,
                        similarity: result.similarity,
                        purchasedProducts: otherUserProducts,
                        purchaseCount: otherUserProducts.length,
                    });
                }
            }

            // Sort by similarity score (highest first)
            userSimilarities.sort((a, b) => b.similarity - a.similarity);

            console.log(
                `✅ Calculated similarities for ${userSimilarities.length} comparable users`
            );
            console.log('\n📊 Top 5 Similar Users:');
            userSimilarities.slice(0, 5).forEach((user, index) => {
                console.log(
                    `   ${index + 1}. User ${user.userId}: ${(user.similarity * 100).toFixed(
                        2
                    )}% similar (${user.purchaseCount} purchases)`
                );
            });

            return userSimilarities;
        } catch (error) {
            console.error('❌ Error calculating similarities:', error);
            throw error;
        }
    }

    /**
     * STEP 4: Generate weighted recommendations
     * Combines products from similar users with weighting by similarity
     * 
     * Time Complexity: O(K × P) where K = top similar users, P = products
     * 
     * @param userProductIds - Already purchased by target user
     * @param similarUsers - Users sorted by similarity
     * @param topK - How many similar users to consider
     * @returns Product ID -> weighted recommendation score
     */
    private generateRecommendationScores(
        userProductIds: number[],
        similarUsers: UserSimilarity[],
        topK: number = 10
    ): Map<number, number> {
        console.log(
            `\n[STEP 4] Generating recommendation scores from top ${topK} similar users...`
        );

        const recommendationScores = new Map<number, number>();
        const topSimilarUsers = similarUsers.slice(0, topK);

        // For each similar user
        for (const similarUser of topSimilarUsers) {
            console.log(
                `\n   Processing User ${similarUser.userId} (${(
                    similarUser.similarity * 100
                ).toFixed(2)}% similar):`
            );

            // For each product they bought
            for (const productId of similarUser.purchasedProducts) {
                // Skip if target user already has this product
                if (userProductIds.includes(productId)) {
                    continue;
                }

                // Add weighted score to this product
                const currentScore = recommendationScores.get(productId) || 0;
                const newScore = currentScore + similarUser.similarity;

                recommendationScores.set(productId, newScore);

                console.log(
                    `      → Product ${productId}: Score increased from ${currentScore.toFixed(
                        3
                    )} to ${newScore.toFixed(3)}`
                );
            }
        }

        console.log(
            `\n✅ Generated scores for ${recommendationScores.size} candidate products`
        );

        return recommendationScores;
    }

    /**
     * STEP 5: Rank and fetch product details
     * Sorts recommendations and retrieves full product information
     * 
     * Time Complexity: O(R log R + R) where R = recommended products
     * 
     * @param recommendationScores - Product scores from step 4
     * @param limit - How many recommendations to return
     * @returns Ranked products with details
     */
    private async getRankedRecommendations(
        recommendationScores: Map<number, number>,
        limit: number = 5
    ): Promise<RecommendedProduct[]> {
        try {
            console.log(`\n[STEP 5] Fetching product details and ranking...`);

            // Convert map to array and sort by score (highest first)
            const rankedProducts: RecommendationScore[] = Array.from(
                recommendationScores.entries()
            )
                .map(([productId, score]) => ({
                    productId,
                    recommendationScore: score,
                }))
                .sort((a, b) => b.recommendationScore - a.recommendationScore)
                .slice(0, limit);

            console.log(`📊 Top ${rankedProducts.length} recommendations:`);
            rankedProducts.forEach((rec, idx) => {
                console.log(`   ${idx + 1}. Product ${rec.productId}: Score ${rec.recommendationScore.toFixed(3)}`);
            });

            // Fetch full product details
            const productIds: number[] = rankedProducts.map((r) => r.productId);

            const products = await Product.findAll({
                where: {
                    id: {
                        [Op.in]: productIds,
                    },
                },
                attributes: ['id', 'name', 'description', 'price', 'image', 'rating', 'stock'],
                raw: true,
            });

            // Attach recommendation scores to products
            const productsWithScores: RecommendedProduct[] = (products as any[]).map(
                (product) => {
                    const recommendation = rankedProducts.find(
                        (r) => r.productId === product.id
                    );
                    return {
                        ...product,
                        recommendationScore: recommendation?.recommendationScore || 0,
                        recommendationType: 'collaborative_filtering',
                    };
                }
            );

            // Sort by recommendation score (ensure ordering)
            productsWithScores.sort(
                (a, b) => b.recommendationScore - a.recommendationScore
            );

            console.log(
                `✅ Retrieved details for ${productsWithScores.length} recommended products\n`
            );

            return productsWithScores;
        } catch (error) {
            console.error('❌ Error getting ranked recommendations:', error);
            throw error;
        }
    }

    /**
     * MAIN METHOD: Get collaborative filtering recommendations
     * Orchestrates all steps of the algorithm
     * 
     * @param userId - Target user ID
     * @param limit - Number of recommendations (default 5)
     * @returns Recommendations with metadata
     */
    async getCollaborativeFilteringRecommendations(
        userId: number,
        limit: number = 5
    ): Promise<CollaborativeFilteringResult | ColdStartResult> {
        try {
            console.log(`\n${'═'.repeat(70)}`);
            console.log(`🤖 COLLABORATIVE FILTERING RECOMMENDATION ENGINE`);
            console.log(`${'═'.repeat(70)}`);
            console.log(`\n👤 Generating recommendations for User ${userId}`);
            console.log(`🎯 Requesting ${limit} recommendations\n`);

            const startTime = Date.now();

            // STEP 1: Get target user's purchase history
            const userProductIds = await this.getUserPurchaseHistory(userId);

            // Handle cold start problem
            if (userProductIds.length === 0) {
                console.log(
                    '\n⚠️  COLD START PROBLEM DETECTED: User has no purchase history'
                );
                console.log('   → Returning popular products instead\n');
                return await this.getColdStartRecommendations(limit);
            }

            // STEP 2: Get all other users
            const allOtherUsers = await this.getAllOtherUsers(userId);

            if (allOtherUsers.length === 0) {
                console.log(
                    '\n⚠️  Not enough users in system for collaborative filtering'
                );
                console.log('   → Returning popular products instead\n');
                return await this.getColdStartRecommendations(limit);
            }

            // STEP 3: Calculate similarities
            const userSimilarities = await this.calculateUserSimilarities(
                userId,
                userProductIds,
                allOtherUsers
            );

            if (userSimilarities.length === 0) {
                console.log('\n⚠️  No similar users found');
                console.log('   → Returning popular products instead\n');
                return await this.getColdStartRecommendations(limit);
            }

            // STEP 4: Generate recommendation scores
            const recommendationScores = this.generateRecommendationScores(
                userProductIds,
                userSimilarities,
                10 // Consider top 10 similar users
            );

            if (recommendationScores.size === 0) {
                console.log('\n⚠️  Could not generate any recommendations');
                console.log('   → Returning popular products instead\n');
                return await this.getColdStartRecommendations(limit);
            }

            // STEP 5: Get ranked recommendations
            const recommendations = await this.getRankedRecommendations(
                recommendationScores,
                limit
            );

            const executionTime = Date.now() - startTime;

            console.log(`${'═'.repeat(70)}`);
            console.log(`✅ ALGORITHM EXECUTION COMPLETED`);
            console.log(`${'═'.repeat(70)}`);
            console.log(`⏱️  Execution Time: ${executionTime}ms`);
            console.log(`📦 Recommendations Returned: ${recommendations.length}`);
            console.log(`${'═'.repeat(70)}\n`);

            return {
                success: true,
                userId,
                algorithm: 'collaborative_filtering',
                similarUsersConsidered: userSimilarities.length,
                topSimilarUsers: userSimilarities.slice(0, 5).map((user) => ({
                    userId: user.userId,
                    similarity: user.similarity,
                    purchaseCount: user.purchaseCount,
                })),
                recommendations,
                executionTime,
            };
        } catch (error) {
            console.error('❌ Error in collaborative filtering recommendation:', error);
            throw error;
        }
    }

    /**
     * COLD START PROBLEM SOLUTION
     * Returns popular products when collaborative filtering can't be used
     * 
     * @param limit - Number of products
     * @returns Popular products
     */
    private async getColdStartRecommendations(limit: number = 5): Promise<ColdStartResult> {
        try {
            const { sequelize } = require('../config/database');

            const popularProducts = await Product.findAll({
                attributes: [
                    'id',
                    'name',
                    'description',
                    'rate',
                    'image',
                    'quantity',
                    [
                        sequelize.fn('COUNT', sequelize.col('orderItems.id')),
                        'order_count',
                    ],
                ],
                include: [
                    {
                        model: OrderItem,
                        attributes: [],
                        required: false,
                    },
                ],
                group: ['Product.id'],
                order: [[sequelize.literal('order_count'), 'DESC']],
                limit,
                subQuery: false,
                raw: true,
            });

            return {
                success: true,
                algorithm: 'popular_products_fallback',
                reason: 'Cold start - not enough user history',
                recommendations: (popularProducts as any[]).map((p) => ({
                    ...p,
                    recommendationScore: 0,
                    recommendationType: 'popular_fallback',
                })),
            };
        } catch (error) {
            console.error('❌ Error getting cold start recommendations:', error);
            throw error;
        }
    }
}

export default new CollaborativeFilteringService();