import PaymentManagement from "../models/PaymentManagementModel";

export interface IPaymentManagement {
    amount: number;
    paymentMethod: string;
    user: number;
    farmId: number;
    remarks: string;
    createdBy: number;

}

class PaymentManagementService {

    static async cretaePayment(data: IPaymentManagement) {
        console.log("data", data)
        try {
            return await PaymentManagement.create({
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                sendToUser: data.user,
                farmId: data.farmId,
                remarks: data.remarks,
                createdBy: data.createdBy
            });
        } catch (err) {
            console.log(err)
        }
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

    // static async getAllPayment() {
    //     return await PaymentManagement.findAll(
    //         {
    //             attributes: [
    //                 "id",
    //                 "amount",
    //                 "paymentMethod",
    //                 "fromUser",
    //                 "createdAt"
    //             ],
    //             order: [["createdAt", "DESC"]]
    //         },
    //         raw: true
    //     );
    // }
    static async getOnePayment(id: number) {
        return await PaymentManagement.findByPk(id
        );
    }

}

export default PaymentManagementService;