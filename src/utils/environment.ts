import *  as  dotenv from 'dotenv';
import { Secret } from 'jsonwebtoken';
dotenv.config();
interface IEnvironmentProps {
    db_host: string | undefined;
    db_port: any
    db_name: string | undefined;
    db_username: string | undefined;
    db_pass: string | undefined;
    app_port: number | undefined | string;
    jwt_secret: Secret;
    email: string;
    email_pass: string;
}

export const envData: IEnvironmentProps = {
    db_host: process.env.db_host || '',
    db_port: process.env.db_port,
    db_name: process.env.db_name || '',
    db_username: process.env.db_username || '',
    db_pass: process.env.db_pass || '',
    app_port: process.env.app_port || 0,
    jwt_secret: process.env.jwt_secret as Secret || '' as Secret,
    email: process.env.email || '',
    email_pass: process.env.email_pass || '',
}