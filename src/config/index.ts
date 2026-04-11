import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
const DB_NAME = process.env.DATABASE_NAME;
const DB_USER = process.env.DATABASE_USER;
const DB_PASSWORD = process.env.DATABASE_PASSWORD;
const DB_HOST = process.env.DATABASE_HOST;
const DB_PORT = process.env.DATABASE_PORT;
const DB_DIALECT = process.env.DATABASE_DIALECT;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
const NODE_ENV = process.env.NODE_ENV;
const BCRYPT_SALT = process.env.BCRYPT_SALT;



export const config = {
    PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    DB_HOST,
    DB_PORT,
    DB_DIALECT,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    NODE_ENV,
    BCRYPT_SALT
};