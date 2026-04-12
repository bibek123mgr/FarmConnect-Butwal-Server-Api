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

    // Self-relation (Parent Category)
    @ForeignKey(() => Category)
    @Column({
        type: DataType.INTEGER,
        allowNull: true,
    })
    declare parentId: number;

    @BelongsTo(() => Category, "parentId")
    parent!: Category;

    @HasMany(() => Category, "parentId")
    children!: Category[];

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

    // Status
    @Default(true)
    @Column({
        type: DataType.BOOLEAN,
    })
    declare isActive: boolean;
}

export default Category;