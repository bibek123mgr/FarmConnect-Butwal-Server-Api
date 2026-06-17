import PaymentManagement from "../models/PaymentManagementModel";

export interface IPaymentManagement {
    amount: number;
    paymentMethod: string;
    user: number;
}

class PaymentManagementService {

    static async cretaePayment(data: IPaymentManagement) {
        return await PaymentManagement.create({
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            fromUser: data.user
        });
    }

    static async updatePayment(id: number, data: IPaymentManagement) {

        return await PaymentManagement.update(data, {
            where: {
                id
            }
        });
    }

    static async deletePayment(id: number) {
        return await PaymentManagement.destroy({
            where: {
                id
            }
        });
    }

    static async getAllPayment() {
        return await PaymentManagement.findAll(
            {
                attributes: [
                    "id",
                    "amount",
                    "paymentMethod",
                    "fromUser",
                    "createdAt"
                ],
                order: [["createdAt", "DESC"]]
            },
            
            raw: true
        );
    }
    static async getOnePayment(id: number) {
        return await PaymentManagement.findByPk(id
        );
    }

}

export default PaymentManagementService;