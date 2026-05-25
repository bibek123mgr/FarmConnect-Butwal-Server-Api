import User from "../../models/UserModel";
import { UserRole } from "../../models/UserModel";
import { ConflictError, UnauthorizedError } from "../../utils/errors";
import JwtHelper from "../../helper/jwtHepler";
import bcrypt from "bcrypt";
import Farm from "../../models/FarmModel";
import { QueryTypes, Sequelize } from "sequelize";
import redisClient from "../../redis/redis";
import sequelize from "../../config/database";

interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    role?: string;
    googleId?: string
}

class AuthService {
    static async checkExistingUser(email: string) {
        const existingUser = await User.findOne(
            {
                where: { email },
                include: [{ model: Farm }]
            },

        );
        if (existingUser) {
            throw new ConflictError('User already exists with this email');
        }
        return false;
    }


    static async createUserWithGoogle(data: CreateUserDTO) {
        const user = await User.create({
            name: data.name,
            email: data.email,
            password: "",
            googleId: data.googleId,
            role: UserRole.USER,
            status: true,
        });

        return user;
    }
    static async createUser(data: CreateUserDTO) {
        await this.checkExistingUser(data.email);
        const user = await User.create({
            name: data.name,
            googleId: data.googleId,
            email: data.email,
            password: data.password,
            role: (data.role as UserRole) || UserRole.USER,
            status: true,
        });

        return user;
    }

    static async getUserByEmail(email: string) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }
        return user;
    }

    static async getUserWithPassword(email: string) {
        const user = await User.scope('withPassword').findOne(
            {
                where: { email },
                include: [
                    {
                        model: Farm,
                        attributes: ["id"]
                    }
                ]
            }
        );

        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }
        return user;
    }

    static async validatePassword(plainPassword: string, hashedPassword: string) {
        const isValid = await bcrypt.compare(plainPassword, hashedPassword);
        if (!isValid) {
            throw new UnauthorizedError('Invalid credentials');
        }
        return true;
    }

    static generateAuthToken(user: any) {
        return JwtHelper.generateToken({
            id: user.id,
            role: user.role,
            farmId: user.farm?.id
        });
    }

    static generateRefreshToken(user: any) {
        return JwtHelper.generateRefreshToken({
            id: user.id,
            role: user.role,
            farmId: user.farm?.id
        });
    }

    static async registerUser(data: CreateUserDTO) {
        await this.checkExistingUser(data.email);
        const user = await this.createUser(data);
        const token = this.generateAuthToken(user);
        return { user, token };
    }

    static async loginWithGoogleOrSignUp(data: CreateUserDTO) {
        const email = data.email;
        const userExists = await User.scope('withPassword').findOne(
            {
                where: { email },
                include: [
                    {
                        model: Farm,
                        attributes: ["id"]
                    }
                ]
            }
        );
        let user;
        if (!userExists) {
            user = await this.createUser(data);
            const token = this.generateAuthToken(user);
            const refreshToken = this.generateRefreshToken(user);
            return { user, token, refreshToken };
        } else if (userExists && userExists.googleId) {
            const token = this.generateAuthToken(userExists);
            const refreshToken = this.generateRefreshToken(userExists);
            return { user: userExists, token, refreshToken };
        } else {
            return null;
        }

    }

    static async loginUser(email: string, password: string) {
        const user = await this.getUserWithPassword(email);
        await this.validatePassword(password, user.password);
        const token = this.generateAuthToken(user);
        const refreshToken = this.generateRefreshToken(user);
        return { user, token, refreshToken };
    }

    static async getUserById(id: number) {
        const user = await User.findByPk(id, {
            attributes: [
                "id",
                "name",
                "email",
                "role",
                [Sequelize.col("farm.id"), "farmId"],
                [Sequelize.col("farm.farmName"), "farmName"]
            ],

            include: [
                {
                    model: Farm,
                    attributes: []
                }
            ]
        });
        await redisClient.set(`user:profile:${id}`, JSON.stringify(user), "EX", 600);
        return user;
    }

    static async getAllUsers() {
        const users = await User.findAll({
            attributes: [
                "id",
                "name",
                "email",
                "role",
                [Sequelize.col("farm.id"), "farmId"],
                [Sequelize.col("farm.farmName"), "farmName"],
                "createdAt"
            ],
            include: [
                {
                    model: Farm,
                    attributes: []
                }
            ]
        });
        return users;
    }

    static async getDashbaordStatic() {

        const [
            totalAmount,
            totalOrder,
            totalProduct,
            totalUser,
            recentOrders,
            topSellingProducts
        ] = await Promise.all([

            sequelize.query<{ totalAmount: number }>(
                `
            SELECT COALESCE(SUM(amount), 0) AS totalAmount
            FROM payments
            WHERE isActive = 1
            `,
                {
                    type: QueryTypes.SELECT,
                    plain: true
                }
            ),

            sequelize.query<{ totalOrder: number }>(
                `
            SELECT COUNT(*) AS totalOrder
            FROM orders
            WHERE isActive = 1
            AND status IN ('pending', 'confirmed', 'shipped', 'delivered')
            `,
                {
                    type: QueryTypes.SELECT,
                    plain: true
                }
            ),

            sequelize.query<{ totalProduct: number }>(
                `
            SELECT COUNT(*) AS totalProduct
            FROM products
            WHERE isActive = 1
            `,
                {
                    type: QueryTypes.SELECT,
                    plain: true
                }
            ),

            sequelize.query<{ totalUser: number }>(
                `
            SELECT COUNT(*) AS totalUser
            FROM users
            WHERE status = 1
            `,
                {
                    type: QueryTypes.SELECT,
                    plain: true
                }
            ),

            sequelize.query<{
                id: number;
                order_status: string;
                total_amount: number;
                created_at: Date;
                name: string;
            }>(
                `
            SELECT 
                orders.id AS id,
                orders.status AS order_status,
                orders.totalAmount AS total_amount,
                orders.createdAt AS created_at,
                users.name AS name

            FROM orders

            INNER JOIN users 
                ON orders.userId = users.id

            WHERE orders.isActive = 1

            ORDER BY orders.createdAt DESC

            LIMIT 5
            `,
                {
                    type: QueryTypes.SELECT
                }
            ),

            sequelize.query<{
                productId: number;
                totalSales: number;
                stock: number;
            }>(
                `
            SELECT 
                productId,

                SUM(sales) AS totalSales,

                SUM(
                    openingStock
                    - sales
                    + salesReturn
                    - damage
                    - chalan
                    + chalanReturn
                    - reserveQuantity
                    + production
                ) AS stock

            FROM actual_stock

            GROUP BY productId

            ORDER BY totalSales DESC

            LIMIT 5
            `,
                {
                    type: QueryTypes.SELECT
                }
            )
        ]);

        return {
            totalAmount: Number(totalAmount?.totalAmount ?? 0),
            totalOrder: totalOrder?.totalOrder ?? 0,
            totalProduct: totalProduct?.totalProduct ?? 0,
            totalUser: totalUser?.totalUser ?? 0,

            recentOrders,

            topSellingProducts
        };
    }
}

export default AuthService;