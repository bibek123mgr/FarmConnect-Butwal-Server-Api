import { Model, Column, DataType, Default, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./UserModel";
import { PaymentMethod } from "./PaymentModel";

@Table({
    tableName: "payment_management",
    timestamps: true
})
export class PaymentManagement extends Model {
    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    declare id: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false,
    })
    declare amount: number;

    @Column({
            type: DataType.ENUM(...Object.values(PaymentMethod)),
            allowNull: false,
        })
    declare paymentMethod: PaymentMethod;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare fromUser: number;

    @BelongsTo(() => User)
    user!: User;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
}

export default PaymentManagement