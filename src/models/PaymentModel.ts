import {
    Table,
    Model,
    Column,
    DataType,
    ForeignKey,
    BelongsTo,
    Default,
} from "sequelize-typescript";

import Order from "./OrderModel";
import User from "./UserModel";

export enum PaymentStatus {
    PENDING = "pending",
    PAID = "paid",
    FAILED = "failed",
    REFUNDED = "refunded",
}

export enum PaymentMethod {
    COD = "cod",
    ESEWA = "esewa",
    KHALTI = "khalti",
    BANK_TRANSFER = "bank_transfer",
}

@Table({
    tableName: "payments",
    timestamps: true,
})
export class Payment extends Model {

    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    declare id: number;

    @ForeignKey(() => Order)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare orderId: number;

    @BelongsTo(() => Order)
    order!: Order;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare amount: number;

    @Default(PaymentStatus.PENDING)
    @Column({
        type: DataType.ENUM(...Object.values(PaymentStatus)),
        allowNull: false,
    })
    declare status: PaymentStatus;

    @Column({
        type: DataType.ENUM(...Object.values(PaymentMethod)),
        allowNull: false,
    })
    declare paymentMethod: PaymentMethod;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare transactionId: string | null;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare userId: number;

    @BelongsTo(() => User)
    user!: User;

    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    declare meta: object | null;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
}

export default Payment;