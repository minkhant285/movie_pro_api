import { Request, Response } from 'express';
import { Like, Repository } from 'typeorm';
import { User } from './user.entity';
import { AppDataSource, ReturnPayload, STATUS_MESSAGE } from '../../utils';

export class UserController {
    private userRepo: Repository<User>;

    constructor() {
        this.userRepo = AppDataSource.getRepository(User);
    }

    getAllUsers = async (req: Request, res: Response) => {
        let users = await this.userRepo.find();
        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: users
        }));
    };

    getUserById = async (req: Request, res: Response) => {
        let id: string = req.params.id;
        let user = await this.userRepo.findOne({ where: { id } });
        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: user
        }));
    };

    searchUsers = async (req: Request, res: Response) => {
        let query: string = req.params.query;
        let users = await this.userRepo.findAndCount({ where: { username: Like(`%${query}%`) } });
        return res.status(200).json(ReturnPayload({
            message: 'search users',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: users
        }));
    };

    updatePhone = async (req: Request, res: Response) => {
        let id: string = req.params.id;
        let { newPhone, password } = req.body as { newPhone: string; password: string };
        const user = await this.userRepo.findOne({ where: { id }, select: ['id', 'password', 'phone'] });

        if (!user || !(await user.checkPassword(password))) {
            return res.status(400).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'Invalid User Or Password',
                status_message: STATUS_MESSAGE.FAIL
            }));
        }

        if (newPhone.length <= 8) {
            return res.status(400).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'Phone number must be greather than 8 number',
                status_message: STATUS_MESSAGE.FAIL
            }));
        }
        else if (newPhone === user.phone) {
            return res.status(400).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'Phone Already Exist!',
                status_message: STATUS_MESSAGE.FAIL
            }));
        }
        else {
            await this.userRepo.update(id, { phone: newPhone })
            return res.status(200).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'New Phone Updated!',
                status_message: STATUS_MESSAGE.SUCCESS
            }));
        }


    }

    updateEmail = async (req: Request, res: Response) => {
        let id: string = req.params.id;
        let { newEmail, password } = req.body as { newEmail: string; password: string };
        const user = await this.userRepo.findOne({ where: { id }, select: ['id', 'password', 'email'] });

        if (!user || !(await user.checkPassword(password))) {
            return res.status(400).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'Invalid User Or Password',
                status_message: STATUS_MESSAGE.FAIL
            }));
        }

        if (!newEmail.includes('@')) {
            return res.status(400).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'Enter Valid Email',
                status_message: STATUS_MESSAGE.FAIL
            }));
        }
        else if (newEmail === user.email) {
            return res.status(400).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'Email Already Exist!',
                status_message: STATUS_MESSAGE.FAIL
            }));
        }
        else {
            await this.userRepo.update(id, { email: newEmail })
            return res.status(200).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'New Email Updated!',
                status_message: STATUS_MESSAGE.SUCCESS
            }));
        }


    }

    updateUser = async (req: Request, res: Response) => {
        let id: string = req.params.id;
        let body = req.body ?? null;
        let updated = await this.userRepo.update(id, {
            username: body.username,
            dob: body.dob,
            gender: body.gender
        });
        if (updated.affected !== 1) {
            return res.status(400).json(ReturnPayload({
                status_code: res.statusCode,
                message: "user update failed!",
                status_message: STATUS_MESSAGE.FAIL,
            }))
        }
        return res.status(200).json(ReturnPayload({
            message: "user update succeeded!",
            status_message: STATUS_MESSAGE.SUCCESS,
            status_code: res.statusCode,
        }));
    };

    deleteUser = async (req: Request, res: Response) => {
        let id: string = req.params.id; // get the user id from req.params
        let deleted = await this.userRepo.delete(id);
        return res.status(200).json(ReturnPayload({
            message: 'deleted',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS
        }));
    };

    updatePhoto = async (req: Request, res: Response) => {
        let id: string = req.params.id;
        let updated = await this.userRepo.update(id, {
            photoUrl: req.file?.filename.toString() || ''
        });
        if (updated.affected !== 1) {
            return res.status(400).json(ReturnPayload({
                message: 'Something Wrong In Updating Photo',
                status_code: res.statusCode,
                status_message: STATUS_MESSAGE.FAIL
            }))
        }
        return res.status(200).json(ReturnPayload({
            message: 'Uphoto Updated!',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS
        }));
    }


}