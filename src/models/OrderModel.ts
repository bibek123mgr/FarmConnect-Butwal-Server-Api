import {
    Table,
    Model,
    Column,
    DataType,
    ForeignKey,
    BelongsTo,
    HasMany,
    HasOne,
    Default,
} from "sequelize-typescript";

import User from "./UserModel";
import { OrderItem } from "./OrderItemModel";
import Payment from "./PaymentModel";

export enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
}

@Table({
    tableName: "orders",
    timestamps: true,
})
export class Order extends Model {

    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    declare id: number;

    // 💰 TOTAL AMOUNT
    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    declare totalAmount: number;

    // 📦 ORDER STATUS
    @Default(OrderStatus.PENDING)
    @Column({
        type: DataType.ENUM(...Object.values(OrderStatus)),
        allowNull: false,
    })
    declare status: OrderStatus;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare userId: number;

    @BelongsTo(() => User)
    user!: User;

    @HasMany(() => OrderItem)
    items!: OrderItem[];

    @HasOne(() => Payment)
    payment!: Payment;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
}

export default Order;