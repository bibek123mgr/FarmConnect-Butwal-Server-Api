import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import Order from "./OrderModel";
import Farm from "./FarmModel";
import User from "./UserModel";
import OrderItem from "./OrderItemModel";
import { PaymentStatus } from "./PaymentModel";

enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled",
}

@Table({
    timestamps: true,
    tableName: "vendor_orders"
})

export class VendorOrder extends Model {

    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    declare id: number

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
    declare totalAmount: number

    @ForeignKey(() => Farm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare farmId: number;

    @BelongsTo(() => Farm)
    farm!: Farm;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare userId: number;

    @BelongsTo(() => User)
    user!: User;


    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;

    @HasMany(() => OrderItem)
    orderItems!: OrderItem[]

    @Default(OrderStatus.PENDING)
    @Column({
        type: DataType.ENUM(...Object.values(OrderStatus)),
        allowNull: false,
    })
    declare status: OrderStatus;

    @Default(PaymentStatus.PENDING)
    @Column({
        type: DataType.ENUM(...Object.values(PaymentStatus)),
        allowNull: false,
    })
    declare paymentStatus: PaymentStatus;

}

export default VendorOrder