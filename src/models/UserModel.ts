import {
    Table,
    Model,
    Column,
    DataType,
    Default,
    Unique,
    IsEmail,
    BeforeCreate,
    BeforeUpdate,
    HasOne
} from "sequelize-typescript";
import bcrypt from "bcrypt";
import { config } from "../config/index";
import Farm from "./FarmModel";

const BCRYPT_SALT = parseInt(config.BCRYPT_SALT as string) || 10;

export enum UserRole {
    SUPERADMIN = "superadmin",
    USER = "user",
    FARMER = "farmer",
}

@Table({
    tableName: "users",
    timestamps: true,
    // This will exclude password from all queries by default
    defaultScope: {
        attributes: { exclude: ['password'] }
    },
    // Use this scope when you need password (like for login)
    scopes: {
        withPassword: {
            attributes: { include: ['password'] }
        }
    }
})
export class User extends Model {
    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER,

    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;

    @Unique
    @IsEmail
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare email: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare password: string;

    @Default(UserRole.USER)
    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        allowNull: false,
    })
    declare role: UserRole;

    @HasOne(() => Farm)
    farm!: Farm;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
    })
    declare status: boolean;

    @BeforeCreate
    static async hashPassword(instance: User) {
        if (instance.password) {
            instance.password = await bcrypt.hash(instance.password, BCRYPT_SALT);
        }
    }

    @BeforeUpdate
    static async updatePassword(instance: User) {
        if (instance.changed("password")) {
            instance.password = await bcrypt.hash(instance.password, BCRYPT_SALT);
        }
    }

    // Method to safely return user data without password
    toJSON() {
        const values = Object.assign({}, this.get());
        delete values.password;
        return values;
    }
}

export default User;