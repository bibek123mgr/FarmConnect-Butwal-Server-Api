import Farm from "../../models/FarmModel";
export interface IFarm {
    id?: number;
    userId: number;

    farmName: string;

    description?: string;
    province?: string;
    district?: string;
    address?: string;

    logo?: string;

    panNo?: string;
    vatNo?: string;

    isActive?: boolean;
    isVerified?: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

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
        });
    }

    static async getAllFarms() {
        return await Farm.findAll({
            order: [["id", "DESC"]],
        });
    }

    static async getFarmById(id: number) {
        return await Farm.findByPk(id);
    }

    static async getFarmsByUser(userId: number) {
        return await Farm.findAll({
            where: { userId },
            order: [["id", "DESC"]],
        });
    }

    static async updateFarm(id: number, data: IUpdateFarm) {
        const farm = await Farm.findByPk(id);

        if (!farm) {
            return null;
        }

        await farm.update(data);

        return farm;
    }

    static async deleteFarm(id: number) {
        const farm = await Farm.findByPk(id);

        if (!farm) {
            return null;
        }

        await farm.destroy();

        return true;
    }
}

export default FarmService;