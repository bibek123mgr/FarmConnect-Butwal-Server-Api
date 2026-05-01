
import crypto from "crypto";

class EsewaCredentialsHelper {

    public static generateHash(secret: string, data: string) {
        const hmac = crypto.createHmac('sha256', secret);
        return hmac.update(data).digest('base64');
    }

    public static generateUniqueId() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

}

export default EsewaCredentialsHelper