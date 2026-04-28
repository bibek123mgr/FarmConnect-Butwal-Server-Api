import sequelize from "../config/database";
import { QueryTypes } from "sequelize";

class AvailableStockHelper {

    public static async getAvailableStock(productId: number) {

        const result: any[] = await sequelize.query(
            `SELECT 
                COALESCE(SUM(
                    openingStock
                    - sales
                    + salesReturn
                    - damage
                    - chalan
                    + chalanReturn
                    - reserveQuantity
                ), 0) AS availableStock
             FROM actual_stock
             WHERE productId = ?
             AND isActive = 1`,
            {
                replacements: [productId],
                type: QueryTypes.SELECT
            }
        );

        return Number(result[0]?.availableStock || 0);
    }
}

export default AvailableStockHelper;