import { Column, DataType, Table, Model, ForeignKey, BelongsTo, Default } from "sequelize-typescript";
import User from "./UserModel";

@Table({
    timestamps: true,
    tableName: "comments"
})

export class Comment extends Model {

    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    declare id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare comment: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare rating: number;

    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare productId: number;

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

export default Comment;