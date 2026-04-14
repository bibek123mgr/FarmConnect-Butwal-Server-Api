import {
    Table,
    Model,
    Column,
    DataType,
    ForeignKey,
    BelongsTo,
    Default,
} from "sequelize-typescript";
import User from "./UserModel";
import Product from "./ProductModel";
import Farm from "./FarmModel";

@Table({
    tableName: "carts",
    timestamps: true,
})
export class Cart extends Model {
    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    declare id: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare userId: number;

    @BelongsTo(() => User)
    user!: User;

    @ForeignKey(() => Product)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare productId: number;

    @BelongsTo(() => Product)
    product!: Product;

    @ForeignKey(() => Farm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare farmId: number;

    @BelongsTo(() => Farm)
    farm!: Farm;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare quantity: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare price: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare total: number;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
}

export default Cart;