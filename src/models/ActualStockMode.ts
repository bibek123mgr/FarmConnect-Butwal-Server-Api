import { BelongsTo, Column, DataType, Default, ForeignKey, Model, Table } from "sequelize-typescript";
import Product from "./ProductModel";
import User from "./UserModel";

@Table({
    tableName: "actual_stock",
    timestamps: true,
})
export class ActualStock extends Model {
    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    declare id: number;

    @ForeignKey(() => Product)
    @Column({
        type: DataType.INTEGER,
    })
    declare productId: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    declare openingStock: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    declare production: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    declare sales: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    declare salesReturn: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    declare damage: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    declare chalan: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    declare chalanReturn: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    declare reserveQuantity: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare createdBy: number;

    @BelongsTo(() => User)
    user!: User;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;

}

export default ActualStock;