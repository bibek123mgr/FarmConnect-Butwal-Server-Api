
import crypto from "crypto";

class EsewaCredentialsHelper {

    public static generateHash(secret: string, data: string) {
        const hmac = crypto.createHmac('sha256', secret);
        return hmac.update(data).digest('base64');
    }

    public static generateUniqueId() {
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
}

export default EsewaCredentialsHelper