import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticateJWT, upload } from '../../utils';
export class UserRoutes {
    public router: Router;
    private userController: UserController = new UserController();

    constructor() {
        this.router = Router();
        this.routes();
    }

    routes() {
        this.router.get(`/`, authenticateJWT, this.userController.getUserById);
        this.router.get(`/getAll`, this.userController.getAllUsers);
        this.router.get(`/search/:query`, this.userController.searchUsers);
        this.router.put(`/`, authenticateJWT, this.userController.updateUser);
        this.router.put(`/change_phone`, authenticateJWT, this.userController.updatePhone);
        this.router.put(`/change_email`, authenticateJWT, this.userController.updateEmail);
        this.router.put('/photo', authenticateJWT, upload.single('file'), this.userController.updatePhoto);
        this.router.delete(`/`, authenticateJWT, this.userController.deleteUser);

    }
}