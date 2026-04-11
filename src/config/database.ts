import { Sequelize } from "sequelize";
import { config } from "./index";

export const sequelize = new Sequelize(
    config.DB_NAME as string,
    config.DB_USER as string,
    config.DB_PASSWORD as string,
    {
        host: config.DB_HOST,
        port: Number(config.DB_PORT),
        dialect: config.DB_DIALECT as any,
    }
);

export const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connection established successfully");
        await sequelize.sync({ alter: true });
        console.log("✅ DB synced");
    } catch (error) {
        console.error("❌ DB error:", error);
        throw error;
    }
};

export default sequelize;