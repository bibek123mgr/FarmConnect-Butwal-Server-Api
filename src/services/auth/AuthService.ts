import User from "../../models/UserModel";
import { UserRole } from "../../models/UserModel";
import { ConflictError, UnauthorizedError } from "../../utils/errors";
import JwtHelper from "../../helper/jwtHepler";
import bcrypt from "bcrypt";
import Farm from "../../models/FarmModel";

interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    role?: string;
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

    static async createUser(data: CreateUserDTO) {
        await this.checkExistingUser(data.email);
        const user = await User.create({
            name: data.name,
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

    static async registerUser(data: CreateUserDTO) {
        await this.checkExistingUser(data.email);
        const user = await this.createUser(data);
        const token = this.generateAuthToken(user);
        return { user, token };
    }

    static async loginUser(email: string, password: string) {
        const user = await this.getUserWithPassword(email);
        await this.validatePassword(password, user.password);
        const token = this.generateAuthToken(user);
        return { user, token };
    }
}

export default AuthService;