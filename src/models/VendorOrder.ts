import { BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, Table } from "sequelize-typescript";
import Order from "./OrderModel";
import Farm from "./FarmModel";
import User from "./UserModel";
import OrderItem from "./OrderItemModel";

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

}

export default VendorOrder