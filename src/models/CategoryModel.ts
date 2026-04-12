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

@Table({
    tableName: "categories",
    timestamps: true,
})
export class Category extends Model {
    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER,
    })
    declare id: number;

    // Category Name
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare name: string;

    // Slug (for API / SEO)
    @Column({
        type: DataType.STRING,
        unique: true,
        allowNull: false,
    })
    declare slug: string;

    // Optional icon/image
    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    declare image: string;

    // Ordering (for UI)
    @Default(0)
    @Column({
        type: DataType.INTEGER,
    })
    declare sortOrder: number;


    @ForeignKey(() => User)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    declare createdBy: number;

    @BelongsTo(() => User)
    user!: User;

    // Status
    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;



}

export default Category;