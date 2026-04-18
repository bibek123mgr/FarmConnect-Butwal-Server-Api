import {
    Table,
    Model,
    Column,
    DataType,
    ForeignKey,
    BelongsTo,
    Default,
} from "sequelize-typescript";
import Product from "./ProductModel";
import User from "./UserModel";
import Farm from "./FarmModel";
import Production from "./ProductionModel";

@Table({
    tableName: "damages",
    timestamps: true,
})
export class Damage extends Model {
    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    declare id: number;

    @ForeignKey(() => Product)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare productId: number;

    @BelongsTo(() => Product)
    product!: Product;

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

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare quantity: number;

    @Column({
        type: DataType.ENUM(
            "WEATHER",
            "PEST",
            "TRANSPORT",
            "STORAGE",
            "EXPIRED",
            "OTHER"
        ),
        allowNull: false,
    })
    declare reason: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
    })
    declare lossAmount: number;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    declare remarks: string;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
}

export default Damage;