// services/CollaborativeFilteringService.ts

import { Op } from 'sequelize';
import Order from '../models/OrderModel';
import Product from '../models/ProductModel';
import User from '../models/UserModel';
import OrderItem from '../models/OrderItemModel';
// types/recommendation.types.ts

/**
 * ═══════════════════════════════════════════════════════════════════
 * COLLABORATIVE FILTERING TYPES
 * ═══════════════════════════════════════════════════════════════════
 */

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

/**
 * ═══════════════════════════════════════════════════════════════════
 * MARKET BASKET ANALYSIS TYPES
 * ═══════════════════════════════════════════════════════════════════
 */

export interface MarketBasketProduct {
    id: number;
    name: string;
    price: number;
    image: string;
    rating: number;
    stock: number;
    coOccurrenceCount: number;      // |Orders with A AND B|
    coOccurrenceFrequency: number;  // Co-purchase Frequency(A,B)
    confidence: number;              // Confidence(A→B) in percentage
    support: number;                 // Support(A→B) in percentage
}

export interface MarketBasketAnalysisResult {
    success: boolean;
    algorithm: string;
    currentProductId: number;
    currentProductName: string;
    totalOrdersWithMainProduct: number;  // |Orders with A|
    totalOrdersInSystem: number;          // Total Orders
    boughtTogether: MarketBasketProduct[];
    metrics: {
        timeComplexity: string;
        spaceComplexity: string;
        executionTime: number;
    };
}

export interface AssociationRule {
    rule: string;
    confidence: number;
    support: number;
    lift: number;
    coOccurrenceCount: number;
}

export interface AssociationRulesResult {
    success: boolean;
    productId: number;
    productName: string;
    totalTransactions: number;
    associationRules: AssociationRule[];
}
class CollaborativeFilteringService {

    /**
     * ═══════════════════════════════════════════════════════════════════
     * COLLABORATIVE FILTERING - JACCARD SIMILARITY (PURE JAVASCRIPT)
     * ═══════════════════════════════════════════════════════════════════
     */

    /**
     * JACCARD SIMILARITY ALGORITHM (Pure JS Implementation)
     * 
     * Formula: J(A,B) = |A ∩ B| / |A ∪ B|
     * 
     * Time Complexity: O(n + m) where n, m = set sizes
     * Space Complexity: O(n + m)
     */
    private calculateJaccardSimilarity(
        userAProducts: number[],
        userBProducts: number[]
    ): JaccardSimilarityResult {
        // Convert to Sets for O(1) operations
        const setA = new Set<number>(userAProducts);
        const setB = new Set<number>(userBProducts);

        // STEP 1: Calculate Intersection (A ∩ B)
        // Only products both users bought
        const intersection: number[] = [];
        for (const product of setA) {
            if (setB.has(product)) {
                intersection.push(product);
            }
        }

        // STEP 2: Calculate Union (A ∪ B)
        // All unique products from both users
        const union = new Set<number>([...setA, ...setB]);

        // STEP 3: Handle edge case
        if (union.size === 0) {
            return {
                intersection: [],
                intersectionCount: 0,
                unionCount: 0,
                similarity: 0,
            };
        }

        // STEP 4: Calculate Jaccard coefficient
        // J(A,B) = |Intersection| / |Union|
        const similarity = intersection.length / union.size;

        console.log(`📊 Jaccard Similarity:
      User A products: ${userAProducts.length}
      User B products: ${userBProducts.length}
      Intersection: ${intersection.length}
      Union: ${union.size}
      Similarity: ${(similarity * 100).toFixed(2)}%`);

        return {
            intersection,
            intersectionCount: intersection.length,
            unionCount: union.size,
            similarity,
        };
    }

    /**
     * STEP 1: Get user's purchase history
     * 
     * Algorithm:
     * 1. Query all order items for user
     * 2. Extract unique product IDs
     * 3. Return sorted array
     */
    private async getUserPurchaseHistory(userId: number): Promise<number[]> {
        try {
            console.log(`[STEP 1] Fetching purchase history for User ${userId}...`);

            // Fetch all order items for this user with completed orders
            const orderItems = await OrderItem.findAll({
                where: { userId },
                attributes: ['productId'],
                include: [
                    {
                        model: Order,
                        attributes: [],
                        // where: { orderStatus: 'completed' },
                    },
                ],
                raw: true,
            });

            // Extract unique product IDs using Set (removes duplicates)
            const productIds = Array.from(
                new Set(orderItems.map((item: any) => item.productId))
            );

            console.log(`✅ User ${userId} purchased ${productIds.length} unique products`);

            return productIds;
        } catch (error) {
            console.error('❌ Error fetching purchase history:', error);
            throw error;
        }
    }

    /**
     * STEP 2: Get all other users
     * 
     * Algorithm:
     * 1. Query all users except current user
     * 2. Filter users who have made orders
     * 3. Return user list
     */
    private async getAllOtherUsers(userId: number): Promise<User[]> {
        try {
            console.log(`[STEP 2] Finding all other users...`);

            // Get all users except the current one
            const users = await User.findAll({
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
                        required: true, // Only users with orders
                    },
                ],
                raw: true,
                subQuery: false,
                group: ['User.id'],
            });

            console.log(`✅ Found ${users.length} other users in system`);
            return users;
        } catch (error) {
            console.error('❌ Error fetching other users:', error);
            throw error;
        }
    }

    /**
     * STEP 3: Calculate User Similarities (Pure JS)
     * 
     * Algorithm:
     * 1. For each other user:
     *    a. Get their purchase history
     *    b. Calculate Jaccard similarity
     *    c. Store similarity score
     * 2. Sort by similarity (highest first)
     * 
     * Time Complexity: O(U × P) where U = users, P = avg products
     */
    private async calculateUserSimilarities(
        userId: number,
        userProductIds: number[],
        allOtherUsers: User[]
    ): Promise<UserSimilarity[]> {
        try {
            console.log(`[STEP 3] Calculating similarities with ${allOtherUsers.length} users...`);

            const similarities: UserSimilarity[] = [];

            // For each other user, calculate similarity
            for (const otherUser of allOtherUsers) {
                // Get their purchase history
                const otherUserProducts = await this.getUserPurchaseHistory(otherUser.id);

                // Skip if they have no purchases
                if (otherUserProducts.length === 0) {
                    continue;
                }

                // Calculate Jaccard similarity
                const result = this.calculateJaccardSimilarity(
                    userProductIds,
                    otherUserProducts
                );

                // Only keep users with meaningful similarity
                if (result.similarity > 0) {
                    similarities.push({
                        userId: otherUser.id,
                        similarity: result.similarity,
                        purchasedProducts: otherUserProducts,
                        purchaseCount: otherUserProducts.length,
                    });
                }
            }

            // SORTING ALGORITHM: QuickSort (built-in)
            // Sort by similarity descending
            similarities.sort((a, b) => b.similarity - a.similarity);

            console.log(
                `✅ Found ${similarities.length} similar users\n`
            );
            console.log('📊 Top 5 Similar Users:');
            similarities.slice(0, 5).forEach((s, idx) => {
                console.log(
                    `  ${idx + 1}. User ${s.userId}: ${(s.similarity * 100).toFixed(2)}% similar`
                );
            });

            return similarities;
        } catch (error) {
            console.error('❌ Error calculating similarities:', error);
            throw error;
        }
    }

    /**
     * STEP 4: Generate Weighted Recommendation Scores (Pure JS)
     * 
     * Algorithm:
     * 1. For each of top K similar users:
     *    a. Get their products
     *    b. Skip products already owned
     *    c. Add similarity score to product
     * 2. Use Map for O(1) lookups
     * 
     * Time Complexity: O(K × P) where K = top users, P = products
     */
    private generateRecommendationScores(
        userProductIds: number[],
        similarUsers: UserSimilarity[],
        topK: number = 10
    ): Map<number, number> {
        console.log(
            `[STEP 4] Generating scores from top ${topK} similar users...`
        );

        // Map to store accumulated scores for each product
        const scores = new Map<number, number>();

        // Take only top K similar users
        const topUsers = similarUsers.slice(0, topK);

        // For each similar user
        for (const user of topUsers) {
            console.log(
                `   Processing User ${user.userId} (${(user.similarity * 100).toFixed(2)}% similar)`
            );

            // For each product they bought
            for (const productId of user.purchasedProducts) {
                // Skip if current user already has this product
                if (userProductIds.includes(productId)) {
                    continue;
                }

                // Get current score (0 if first time)
                const currentScore = scores.get(productId) || 0;

                // Add similarity as weight to the product score
                // Higher similarity users contribute more to the score
                const newScore = currentScore + user.similarity;

                scores.set(productId, newScore);
            }
        }

        console.log(
            `✅ Generated scores for ${scores.size} candidate products\n`
        );

        return scores;
    }

    /**
     * STEP 5: Rank Products and Fetch Details (Pure JS)
     * 
     * Algorithm:
     * 1. Convert Map to Array
     * 2. Sort by score (QuickSort)
     * 3. Take top N
     * 4. Fetch product details
     * 
     * Time Complexity: O(R log R) where R = recommended products
     */
    private async getRankedRecommendations(
        scores: Map<number, number>,
        limit: number = 5
    ): Promise<RecommendedProduct[]> {
        try {
            console.log(`[STEP 5] Ranking and fetching product details...`);

            // CONVERT MAP TO ARRAY
            // Each entry: [productId, score]
            const scoreArray = Array.from(scores.entries());

            // SORTING: QuickSort algorithm (JavaScript's built-in sort)
            // Time: O(R log R) where R = products to recommend
            scoreArray.sort((a, b) => b[1] - a[1]); // Descending order

            // TAKE TOP N
            const topProductIds = scoreArray
                .slice(0, limit)
                .map(([productId]) => productId);

            console.log(`📊 Top ${topProductIds.length} products by score:`);
            scoreArray.slice(0, limit).forEach(([productId, score], idx) => {
                console.log(`  ${idx + 1}. Product ${productId}: Score ${score.toFixed(3)}`);
            });

            // FETCH PRODUCT DETAILS
            const products = await Product.findAll({
                where: {
                    id: { [Op.in]: topProductIds },
                },
                attributes: ['id', 'name', 'description', 'unit','image', 'rate', 'quantity'],
                raw: true,
            });

            // ATTACH SCORES TO PRODUCTS
            const recommendedProducts: RecommendedProduct[] = (products as any[]).map(
                (product) => {
                    const score = scoreArray.find((s) => s[0] === product.id)?.[1] || 0;
                    return {
                        ...product,
                        rating: product.rate,
                        stock: product.quantity,
                        recommendationScore: score,
                        recommendationType: 'collaborative_filtering',
                    };
                }
            );

            // FINAL SORT: Ensure ordering is correct
            recommendedProducts.sort(
                (a, b) => b.recommendationScore - a.recommendationScore
            );

            console.log(`✅ Retrieved ${recommendedProducts.length} products\n`);

            return recommendedProducts;
        } catch (error) {
            console.error('❌ Error ranking recommendations:', error);
            throw error;
        }
    }

    /**
     * MAIN: Collaborative Filtering Recommendations
     * 
     * Complete Algorithm Flow:
     * STEP 1: Get target user's purchase history
     * STEP 2: Find all other users
     * STEP 3: Calculate similarity with each user (Jaccard)
     * STEP 4: Generate weighted recommendations
     * STEP 5: Rank and return top products
     */
    async getCollaborativeFilteringRecommendations(
        userId: number,
        limit: number = 5
    ): Promise<CollaborativeFilteringResult | ColdStartResult> {
        try {
            console.log(`\n${'═'.repeat(80)}`);
            console.log(`🤖 COLLABORATIVE FILTERING - PURE JAVASCRIPT IMPLEMENTATION`);
            console.log(`${'═'.repeat(80)}\n`);

            const startTime = Date.now();

            // STEP 1
            const userProducts = await this.getUserPurchaseHistory(userId);

            if (userProducts.length === 0) {
                console.log('⚠️  User has no purchase history (Cold Start)');
                return await this.getColdStartRecommendations(limit);
            }

            // STEP 2
            const otherUsers = await this.getAllOtherUsers(userId);

            if (otherUsers.length === 0) {
                console.log('⚠️  Not enough users in system');
                return await this.getColdStartRecommendations(limit);
            }

            // STEP 3
            const similarities = await this.calculateUserSimilarities(
                userId,
                userProducts,
                otherUsers
            );

            if (similarities.length === 0) {
                console.log('⚠️  No similar users found');
                return await this.getColdStartRecommendations(limit);
            }

            // STEP 4
            const scores = this.generateRecommendationScores(
                userProducts,
                similarities,
                10
            );

            if (scores.size === 0) {
                console.log('⚠️  Could not generate recommendations');
                return await this.getColdStartRecommendations(limit);
            }

            // STEP 5
            const recommendations = await this.getRankedRecommendations(scores, limit);

            const executionTime = Date.now() - startTime;

            console.log(`${'═'.repeat(80)}`);
            console.log(`✅ ALGORITHM COMPLETED`);
            console.log(`${'═'.repeat(80)}`);
            console.log(`⏱️  Time: ${executionTime}ms`);
            console.log(`📊 Similarities computed: ${similarities.length}`);
            console.log(`📦 Recommendations: ${recommendations.length}\n`);

            return {
                success: true,
                userId,
                algorithm: 'collaborative_filtering',
                similarUsersConsidered: similarities.length,
                topSimilarUsers: similarities.slice(0, 5).map((s) => ({
                    userId: s.userId,
                    similarity: s.similarity,
                    purchaseCount: s.purchaseCount,
                })),
                recommendations,
                executionTime,
            };
        } catch (error) {
            console.error('❌ Error:', error);
            throw error;
        }
    }

    /**
     * Cold Start: Return popular products
     */
    private async getColdStartRecommendations(limit: number = 5): Promise<ColdStartResult> {
        try {
            // Get all products with their order counts
            const allItems = await OrderItem.findAll({
                attributes: ['productId'],
                include: [
                    {
                        model: Order,
                        attributes: [],
                        // where: { orderStatus: 'completed' },
                    },
                ],
                raw: true,
            });

            // COUNT FREQUENCY IN JAVASCRIPT
            // Build map of productId -> order count
            const productOrderMap = new Map<number, number>();

            for (const item of allItems) {
                const count = productOrderMap.get(item.productId) || 0;
                productOrderMap.set(item.productId, count + 1);
            }

            // SORT by order count (descending)
            const topProductIds = Array.from(productOrderMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([productId]) => productId);

            // Fetch products
            const products = await Product.findAll({
                where: { id: { [Op.in]: topProductIds } },
                attributes: ['id', 'name', 'description', 'unit', 'image', 'rate', 'quantity'],
                raw: true,
            });

            return {
                success: true,
                algorithm: 'popular_products_fallback',
                reason: 'Cold start fallback',
                recommendations: (products as any[]).map((p) => ({
                    ...p,
                    rating: p.rate,
                    stock: p.quantity,
                    recommendationScore: 0,
                    recommendationType: 'popular_fallback',
                })),
            };
        } catch (error) {
            console.error('❌ Error in cold start:', error);
            throw error;
        }
    }

    /**
     * ═══════════════════════════════════════════════════════════════════
     * MARKET BASKET ANALYSIS - PURE JAVASCRIPT IMPLEMENTATION
     * ═══════════════════════════════════════════════════════════════════
     * 
     * Algorithm: Association Rule Mining using Co-occurrence Analysis
     * 
     * Mathematical Formulation:
     * Co-purchase Frequency(A,B) = |Orders with A AND B| / |Orders with A|
     * Confidence(A→B) = Co-purchase Frequency(A,B) × 100%
     * Support(A→B) = |Orders with A AND B| / Total Orders × 100%
     * 
     * Time Complexity: O(n × m) where n = orders, m = items per order
     * Space Complexity: O(p) where p = unique products
     */

    async getMarketBasketAnalysis(
        productId: number,
        limit: number = 5
    ): Promise<MarketBasketAnalysisResult> {
        try {
            const startTime = Date.now();

            console.log(`\n${'═'.repeat(80)}`);
            console.log(`📊 MARKET BASKET ANALYSIS - PURE JAVASCRIPT IMPLEMENTATION`);
            console.log(`${'═'.repeat(80)}\n`);

            // ─────────────────────────────────────────────────────────
            // STEP 1: Fetch main product
            // ─────────────────────────────────────────────────────────
            console.log(`[STEP 1] Fetching product ${productId}...`);

            const mainProduct = await Product.findByPk(productId, {
                attributes: ['id', 'name', 'unit', 'image', 'rate', 'quantity'],
            });

            if (!mainProduct) {
                throw new Error(`Product ${productId} not found`);
            }

            console.log(`✅ Product: ${mainProduct.name}\n`);

            // ─────────────────────────────────────────────────────────
            // STEP 2: Fetch ALL orders containing this product
            // ─────────────────────────────────────────────────────────
            console.log(`[STEP 2] Fetching all orders with this product...`);

            const ordersWithProduct = await OrderItem.findAll({
                attributes: ['orderId'],
                where: { productId },
                include: [
                    {
                        model: Order,
                        attributes: [],
                        // where: { orderStatus: 'completed' },
                    },
                ],
                raw: true,
            });

            // Extract unique order IDs
            const orderIds = Array.from(
                new Set(ordersWithProduct.map((item: any) => item.orderId))
            );

            console.log(`✅ Found ${orderIds.length} orders with this product\n`);

            if (orderIds.length === 0) {
                return {
                    success: true,
                    algorithm: 'market_basket_analysis',
                    currentProductId: productId,
                    currentProductName: mainProduct.name,
                    totalOrdersWithMainProduct: 0,
                    totalOrdersInSystem: 0,
                    boughtTogether: [],
                    metrics: {
                        timeComplexity: 'O(n × m)',
                        spaceComplexity: 'O(p)',
                        executionTime: Date.now() - startTime,
                    },
                };
            }

            // ─────────────────────────────────────────────────────────
            // STEP 3: Fetch ALL items from these orders
            // ─────────────────────────────────────────────────────────
            console.log(`[STEP 3] Fetching all items from these orders...`);

            const allItemsInOrders = await OrderItem.findAll({
                attributes: ['productId', 'orderId'],
                where: {
                    orderId: { [Op.in]: orderIds },
                },
                raw: true,
            });

            console.log(`✅ Found ${allItemsInOrders.length} total items\n`);

            // ─────────────────────────────────────────────────────────
            // STEP 4: Count co-occurrences (Pure JS Algorithm)
            // ─────────────────────────────────────────────────────────
            console.log(`[STEP 4] Calculating co-occurrence frequencies...\n`);

            // Create map: productId -> count
            const coOccurrenceMap = new Map<number, number>();

            // For each item in the orders
            for (const item of allItemsInOrders) {
                // Skip the main product itself
                if (item.productId === productId) {
                    continue;
                }

                // Increment count for this product
                const currentCount = coOccurrenceMap.get(item.productId) || 0;
                coOccurrenceMap.set(item.productId, currentCount + 1);
            }

            console.log(`✅ Found ${coOccurrenceMap.size} unique products\n`);

            // ─────────────────────────────────────────────────────────
            // STEP 5: Calculate metrics for each product
            // ─────────────────────────────────────────────────────────
            console.log(`[STEP 5] Calculating confidence and support metrics...\n`);

            // Get all total orders in system
            const allOrders = await Order.findAll({
                // where: { orderStatus: 'completed' },
                attributes: ['id'],
                raw: true,
            });

            const totalOrdersInSystem = allOrders.length;

            console.log(`   Total orders in system: ${totalOrdersInSystem}\n`);

            // ─────────────────────────────────────────────────────────
            // STEP 6: Sort by co-occurrence and get top products
            // ─────────────────────────────────────────────────────────
            console.log(`[STEP 6] Sorting and fetching top ${limit} products...\n`);

            // Convert map to array and sort
            // Array of: [productId, coOccurrenceCount]
            const sortedProducts = Array.from(coOccurrenceMap.entries())
                .sort((a, b) => b[1] - a[1]) // Sort by count descending
                .slice(0, limit)
                .map(([id]) => id);

            // Fetch product details
            const products = await Product.findAll({
                where: {
                    id: { [Op.in]: sortedProducts },
                    quantity: { [Op.gt]: 0 },
                },
                attributes: ['id', 'name', 'description','unit', 'image', 'rate', 'quantity'],
                raw: true,
            });

            // ─────────────────────────────────────────────────────────
            // STEP 7: Calculate association rules for each product
            // ─────────────────────────────────────────────────────────
            console.log(`[STEP 7] Computing association rules...\n`);

            const basketProducts: MarketBasketProduct[] = (products as any[]).map(
                (product) => {
                    // Get co-occurrence count
                    const coOccurrenceCount = coOccurrenceMap.get(product.id) || 0;

                    // CO-PURCHASE FREQUENCY FORMULA
                    // Co-purchase Freq = |Orders with A AND B| / |Orders with A|
                    const coOccurrenceFrequency = coOccurrenceCount / orderIds.length;

                    // CONFIDENCE FORMULA
                    // Confidence(A→B) = Co-purchase Frequency(A,B) × 100%
                    const confidence = coOccurrenceFrequency * 100;

                    // SUPPORT FORMULA
                    // Support(A→B) = |Orders with A AND B| / Total Orders × 100%
                    const support = (coOccurrenceCount / totalOrdersInSystem) * 100;

                    console.log(`   📦 ${product.name}
      Co-occurrence: ${coOccurrenceCount}
      Frequency: ${coOccurrenceFrequency.toFixed(4)}
      Confidence: ${confidence.toFixed(2)}%
      Support: ${support.toFixed(2)}%`);

                    return {
                        ...product,
                        rating: product.rate,
                        stock: product.quantity,
                        coOccurrenceCount,
                        coOccurrenceFrequency: parseFloat(coOccurrenceFrequency.toFixed(4)),
                        confidence: Math.round(confidence),
                        support: parseFloat(support.toFixed(2)),
                    };
                }
            );

            const executionTime = Date.now() - startTime;

            console.log(`\n${'═'.repeat(80)}`);
            console.log(`✅ ANALYSIS COMPLETED`);
            console.log(`${'═'.repeat(80)}`);
            console.log(`
📊 SUMMARY:
   Product: ${mainProduct.name}
   Orders Analyzed: ${orderIds.length}
   Products Found: ${basketProducts.length}
   Time: ${executionTime}ms

⚙️ ALGORITHM PERFORMANCE:
   Time Complexity:  O(n × m)
   Space Complexity: O(p)
   Processing: Pure JavaScript
${'═'.repeat(80)}\n`);

            return {
                success: true,
                algorithm: 'market_basket_analysis',
                currentProductId: productId,
                currentProductName: mainProduct.name,
                totalOrdersWithMainProduct: orderIds.length,
                totalOrdersInSystem,
                boughtTogether: basketProducts,
                metrics: {
                    timeComplexity: 'O(n × m)',
                    spaceComplexity: 'O(p)',
                    executionTime,
                },
            };
        } catch (error) {
            console.error('❌ Error:', error);
            throw error;
        }
    }

    /**
     * Get Association Rules with Lift
     */
    async getAssociationRules(
        productId: number,
        limit: number = 5
    ): Promise<AssociationRulesResult> {
        try {
            const result = await this.getMarketBasketAnalysis(productId, limit);

            if (!result.success || result.boughtTogether.length === 0) {
                throw new Error('Could not generate association rules');
            }

            // CALCULATE LIFT in JavaScript
            // Lift = Confidence / (Support of B)
            // Lift > 1 means A and B are positively correlated
            // Lift = 1 means A and B are independent
            // Lift < 1 means A and B are negatively correlated

            const rules: AssociationRule[] = result.boughtTogether.map((product) => {
                // Lift calculation
                const lift = product.confidence / Math.max(product.support, 0.1);

                return {
                    rule: `${result.currentProductName} → ${product.name}`,
                    confidence: product.confidence,
                    support: product.support,
                    lift: parseFloat(lift.toFixed(2)),
                    coOccurrenceCount: product.coOccurrenceCount,
                };
            });

            console.log(`\n📊 ASSOCIATION RULES WITH LIFT:\n`);
            rules.forEach((rule, idx) => {
                console.log(`${idx + 1}. ${rule.rule}`);
                console.log(`   Confidence: ${rule.confidence}%`);
                console.log(`   Support: ${rule.support.toFixed(2)}%`);
                console.log(`   Lift: ${rule.lift}`);
                console.log(`   Times Bought: ${rule.coOccurrenceCount}\n`);
            });

            return {
                success: true,
                productId,
                productName: result.currentProductName,
                totalTransactions: result.totalOrdersInSystem,
                associationRules: rules,
            };
        } catch (error) {
            console.error('❌ Error:', error);
            throw error;
        }
    }
}

export default new CollaborativeFilteringService();