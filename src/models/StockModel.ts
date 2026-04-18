import { BelongsTo, Column, DataType, Default, ForeignKey, Model, Table } from "sequelize-typescript";
import Product from "./ProductModel";
import User from "./UserModel";
import Farm from "./FarmModel";

export enum comesFrom {
    OPENING_STOCK = "opening_stock",
    PRODUCTION = "production",
    SALES = "sales",
    SALES_RETURN = "sales_return",
    DAMAGE = "damage",
    CHALAN = "chalan",
    CHALAN_RETURN = "chalan_return",
}
@Table({
    tableName: "stock",
    timestamps: true,
})
export class Stock extends Model {
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
    declare rate: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0,
    })
    declare amount: number;


    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare createdBy: number;

    @BelongsTo(() => User)
    user!: User;

    @ForeignKey(() => Farm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare farmId: number;


    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare tableId: number;

    @Column({
        type: DataType.ENUM(...Object.values(comesFrom)),
        allowNull: false,
    })
    declare comesFrom: comesFrom;

}

export default Stock;