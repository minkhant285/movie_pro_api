import jwt from 'jsonwebtoken';
import { envData } from './environment';
import { jwtDecode } from "jwt-decode";

const SECRET_KEY = envData.jwt_secret;

export function generateToken(payload: any, expiresIn?: string | number): string {
    if (SECRET_KEY) {
        return jwt.sign({ payload }, SECRET_KEY, { expiresIn: expiresIn && expiresIn });
    }
    return 'Please Specify JWT Secret in env file'
}

export function decodeToken(token: string) {
    return jwtDecode(token);
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        return null;
    }
}
