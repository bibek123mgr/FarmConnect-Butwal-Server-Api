import {
    Table,
    Model,
    Column,
    DataType,
    Default,
    ForeignKey,
    BelongsTo,
} from "sequelize-typescript";
import User from "./UserModel";

@Table({
    tableName: "farms",
    timestamps: true,
})
export class Farm extends Model {
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

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare farmName: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare description: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare province: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare district: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare address: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare logo: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare panNo: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare vatNo: string;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;

    @Default(false)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isVerified: boolean;
}

export default Farm;