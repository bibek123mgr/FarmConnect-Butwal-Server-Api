import {
    Table,
    Model,
    Column,
    DataType,
    ForeignKey,
    BelongsTo,
    Default
} from "sequelize-typescript";
import Product from "./ProductModel";
import User from "./UserModel";
import Farm from "./FarmModel";

@Table({
    tableName: "product_prices",
    timestamps: true
})
export class ProductPrice extends Model {

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
    declare effectiveFrom: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true
    })
    declare effectiveTo: Date;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare updatedBy: number;

    @BelongsTo(() => User)
    user!: User;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN
    })
    declare isActive: boolean;
}

export default ProductPrice;