import { Router } from 'express';
import { authenticateJWT, upload } from '../../utils';
import { AuthController } from './auth.controller';
export class AuthRoutes {
    public router: Router;
    private authController: AuthController = new AuthController();

    constructor() {
        this.router = Router();
        this.routes();
    }

    routes() {
        this.router.post(`/register`, this.authController.register);
        this.router.post(`/login`, this.authController.login);
        this.router.post(`/forgotpass`, this.authController.forgotPassword);
        this.router.put(`/changepass`, authenticateJWT, this.authController.changePass);
        this.router.put(`/twowayAuth`, authenticateJWT, this.authController.changeAuthType);
        this.router.post(`/resetpass`, this.authController.resetPassword);
    }
}