import {
    Table,
    Model,
    Column,
    DataType,
    ForeignKey,
    BelongsTo
} from "sequelize-typescript";
import Product from "./ProductModel";
import User from "./UserModel";
import Farm from "./FarmModel";

@Table({
    tableName: "product_price_histories",
    timestamps: true
})
export class ProductPriceHistory extends Model {

    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER
    })
    declare id: number;

    @ForeignKey(() => Product)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare productId: number;

    @BelongsTo(() => Product)
    product!: Product;

    @ForeignKey(() => Farm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare farmId: number;

    @BelongsTo(() => Farm)
    farm!: Farm;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare title: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false
    })
    declare price: number;

    @Column({
        type: DataType.ENUM("FIXED", "DISCOUNT"),
        allowNull: false
    })
    declare type: string;

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    declare changedAt: Date;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare changedBy: number;

    @BelongsTo(() => User)
    user!: User;
}

export default ProductPriceHistory;