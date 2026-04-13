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

export enum NotificationType {
    ORDER = "ORDER",
    PAYMENT = "PAYMENT",
    STOCK = "STOCK",
    SYSTEM = "SYSTEM",
}

@Table({
    tableName: "notifications",
    timestamps: true,
})
export class Notification extends Model {

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
    declare title: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    declare message: string;

    @Column({
        type: DataType.ENUM("ORDER", "PAYMENT", "STOCK", "SYSTEM"),
        allowNull: false,
    })
    declare type: NotificationType;

    @Default(false)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isRead: boolean;

    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    declare meta: object;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
}

export default Notification;