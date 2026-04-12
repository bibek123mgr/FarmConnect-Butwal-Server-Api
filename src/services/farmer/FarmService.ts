import Farm from "../../models/FarmModel";
import { NotFoundError } from "../../utils/errors";

export interface ICreateFarm {
    userId: number;
    farmName: string;
    description?: string;
    province?: string;
    district?: string;
    address?: string;
    logo?: string;
    panNo?: string;
    vatNo?: string;
}

export interface IUpdateFarm {
    farmName?: string;
    description?: string;
    province?: string;
    district?: string;
    address?: string;
    logo?: string;
    panNo?: string;
    vatNo?: string;
    isActive?: boolean;
    isVerified?: boolean;
}

class FarmService {
    static async createFarm(data: ICreateFarm) {
        return await Farm.create({
            userId: data.userId,
            farmName: data.farmName,
            description: data.description,
            province: data.province,
            district: data.district,
            address: data.address,
            logo: data.logo,
            panNo: data.panNo,
            vatNo: data.vatNo,
            isActive: true,
            isVerified: false,
        });
    }

    static async getAllFarms() {
        return await Farm.findAll({
            where: { isActive: true },
            order: [["createdAt", "DESC"]],
        });
    }

    static async getFarmById(id: number) {
        const farm = await Farm.findByPk(id);

        if (!farm) {
            throw new NotFoundError("Farm not found");
        }

        return farm;
    }

    static async getFarmsByUser(userId: number) {
        return await Farm.findAll({
            where: { userId, isActive: true },
            order: [["createdAt", "DESC"]],
        });
    }

    static async updateFarm(id: number, data: IUpdateFarm) {
        const farm = await Farm.findByPk(id);
        if (!farm) {
            throw new NotFoundError("Farm not found");
        }
        await farm.update(data);
        return farm;
    }

    static async deleteFarm(id: number) {
        const farm = await Farm.findByPk(id);
        if (!farm) {
            throw new NotFoundError("Farm not found");
        }
        await farm.update({ isActive: false });
        return true;
    }
}

export default FarmService;