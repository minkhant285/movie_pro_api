import { Request, Response, NextFunction } from 'express';
import { decodeToken, verifyToken } from './jwt.helper';
import { ReturnPayload, STATUS_MESSAGE } from './return_payload';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1] || "";
    if (token) {
        const decoded: any = decodeToken(req.headers.authorization || "");
        const payload = verifyToken(token);
        if (payload && decoded) {
            req.params.id = decoded.payload.id;
            return next();
        }
    }
    res.status(401).json(ReturnPayload({
        message: 'Unathorize Request',
        status_code: res.statusCode,
        status_message: STATUS_MESSAGE.FAIL
    }));
};
