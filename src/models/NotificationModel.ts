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
    INFO = "INFO",
    SUCCESS = "SUCCESS",
    WARNING = "WARNING",
    ERROR = "ERROR",
    ORDER = "ORDER",
    STOCK = "STOCK",
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
        type: DataType.ENUM(
            "INFO",
            "SUCCESS",
            "WARNING",
            "ERROR",
            "ORDER",
            "STOCK"
        ),
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

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare readAt: Date;

    @Default(false)
    @Column({
        type: DataType.BOOLEAN,
        defaultValue: true,
    })
    declare status: boolean;
}

export default Notification;