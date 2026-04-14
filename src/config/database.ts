import { Sequelize } from "sequelize-typescript";
import { config } from "./index";
import path from "path";

export const sequelize = new Sequelize(
    config.DB_NAME as string,
    config.DB_USER as string,
    config.DB_PASSWORD as string,
    {
        host: config.DB_HOST,
        port: Number(config.DB_PORT),
        dialect: config.DB_DIALECT as any,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        logging: console.log,
        models: [path.join(__dirname, "../models")],
    }
);

export const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connection established successfully");
        await sequelize.sync({alter: false});
        console.log("✅ Database synced successfully");
    } catch (error) {
        console.error("❌ Database error:", error);
        throw error;
    }
};

export default sequelize;