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
import Product from "./ProductModel";
import User from "./UserModel";
import Farm from "./FarmModel";

@Table({
    tableName: "order_items",
    timestamps: true,
})
export class OrderItem extends Model {
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

    @ForeignKey(() => Product)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare productId: number;

    @BelongsTo(() => Product)
    product!: Product;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare price: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare quantity: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare subtotal: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare userId: number;

    @BelongsTo(() => User)
    user!: User;

    @ForeignKey(() => Farm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare farmId: number;

    @BelongsTo(() => Farm)
    farm!: Farm;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
}

export default OrderItem;