import sequelize from "../config/database";
import { QueryTypes } from "sequelize";

class AvailableStockHelper {

    public static async getAvailableStock(productId: number, farmId: number) {

        const result: any[] = await sequelize.query(
            `SELECT 
                COALESCE(SUM(
                    openingStock
                    - sales
                    + salesReturn
                    - damage
                    - chalan
                    + chalanReturn
                ), 0) AS availableStock
             FROM stocks
             WHERE productId = ?
             AND farmId = ?
             AND isActive = 1`,
            {
                replacements: [productId, farmId],
                type: QueryTypes.SELECT
            }
        );

        return Number(result[0]?.availableStock || 0);
    }
}

export default AvailableStockHelper;