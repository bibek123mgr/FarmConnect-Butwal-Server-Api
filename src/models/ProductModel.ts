import {
    Table,
    Model,
    Column,
    DataType,
    ForeignKey,
    BelongsTo,
    HasMany,
    Default,
} from "sequelize-typescript";
import User from "./UserModel";
import Farm from "./FarmModel";

@Table({
    tableName: "products",
    timestamps: true,
})
export class Product extends Model {
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
    declare farmerId: number;

    @BelongsTo(() => User)
    farmer!: User;

    @ForeignKey(() => Farm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare farmId: number;

    @BelongsTo(() => Farm)
    farm!: Farm;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare description: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare unit: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0
    })
    declare rate: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        defaultValue: 0
    })
    declare quantity: number;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
}

export default Product;