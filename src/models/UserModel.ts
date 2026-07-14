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
    HasOne,
    HasMany
} from "sequelize-typescript";
import bcrypt from "bcrypt";
import { config } from "../config/index";
import Farm from "./FarmModel";
import OrderItem from "./OrderItemModel";

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

    @Unique
    @Column({
        type: DataType.STRING,
    })
    declare phone: string;

    @Column({
        type: DataType.STRING,
    })
    declare address: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare password: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare googleId: string;

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

    @HasMany(() => OrderItem)
    orderItems!: OrderItem[]

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


    toJSON() {
        const values = Object.assign({}, this.get());
        delete values.password;
        return values;
    }
}

export default User;