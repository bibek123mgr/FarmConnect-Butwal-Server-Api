import { Model, Column, DataType, Default, Table, ForeignKey, BelongsTo } from "sequelize-typescript";
import User from "./UserModel";
import { PaymentMethod } from "./PaymentModel";
import Farm from "./FarmModel";

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
        type: DataType.STRING,
        allowNull: false,
    })
    declare paymentMethod: String;

    @Column({
        type: DataType.STRING
    })
    declare remarks: string;


    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare sendToUser: number;

    @BelongsTo(() => User)
    sendUser!: User;

    @ForeignKey(() => Farm)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare farmId: number;

    @BelongsTo(() => Farm)
    farm!: Farm;

    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare createdBy: number;

    @BelongsTo(() => User)
    user!: User;
}




export default PaymentManagement