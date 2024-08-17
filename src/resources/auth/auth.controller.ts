import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource, ReturnPayload, STATUS_MESSAGE } from '../../utils';
import { User } from '../user/user.entity';
import { generateToken } from '../../utils/jwt.helper';
import { ForgotPasswordRequestBody, ILoginBody, IRegisterBody, ResetPasswordRequestBody } from './auth.model';
import bcrypt from 'bcrypt';
export class AuthController {
    private userRepo: Repository<User>;

    constructor() {
        this.userRepo = AppDataSource.getRepository(User);
    }

    login = async (req: Request, res: Response) => {
        try {
            const { phemail, password } = req.body as ILoginBody;


            // Validate input
            if (!phemail || !password) {
                return res.status(400).json(ReturnPayload({
                    message: 'Phone/Email and password are required',
                    status_message: STATUS_MESSAGE.SUCCESS,
                    status_code: res.statusCode
                }));
            }

            let user: User | null;

            if (phemail.includes('@')) {
                let result = await this.userRepo.findOne({ where: { email: phemail }, select: ['id', 'username', 'password', 'registeredType', 'twoWayAuth'] });
                if (result?.registeredType === "email" || result?.twoWayAuth) {
                    user = result;
                } else {
                    user = null;

                }
            } else {
                let result = await this.userRepo.findOne({ where: { phone: phemail }, select: ['id', 'username', 'password', 'registeredType', 'twoWayAuth'] });
                if (result?.registeredType === "phone" || result?.twoWayAuth) {
                    user = result;
                } else {
                    user = null
                }
            }

            if (!user || !(await user.checkPassword(password))) {
                return res.status(400).json(ReturnPayload({
                    status_code: res.statusCode,
                    message: 'Invalid Email/Phone or password',
                    status_message: STATUS_MESSAGE.FAIL
                }));
            }
            const token = generateToken({ id: user.id, username: user.username }, '1hr');
            setTimeout(() => {

                res.status(200).json(ReturnPayload({
                    status_code: res.statusCode,
                    message: 'Login successful',
                    status_message: STATUS_MESSAGE.SUCCESS,
                    result: { token }
                }));
            }, 2000);


        } catch (error) {
            res.status(500).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'Internal server error',
                status_message: STATUS_MESSAGE.FAIL,
                error
            }));
        }
    };

    register = async (req: Request, res: Response) => {
        try {
            const { phemail, username, password } = req.body as IRegisterBody;

            // Validate input
            if (!phemail || !username || !password) {
                return res.status(400).json(ReturnPayload({
                    status_code: res.statusCode,
                    message: 'Phone/Email, Username and password are required',
                    status_message: STATUS_MESSAGE.FAIL,
                }));
            }

            // Check if the user already exists
            const existingUser = await this.userRepo.findOne({ where: [{ username: username }, { phone: phemail }, { email: phemail }] });
            if (existingUser) {
                return res.status(400).json(ReturnPayload({
                    status_code: res.statusCode,
                    message: 'User Already Exist!',
                    status_message: STATUS_MESSAGE.FAIL,
                }));
            }

            if (!phemail.includes('@') && phemail.length <= 8) {
                return res.status(400).json(ReturnPayload({
                    status_code: res.statusCode,
                    message: 'Phone number must be greather than 8 number',
                    status_message: STATUS_MESSAGE.FAIL,
                }));
            }
            else if (!phemail.includes('@') && !/^\d+$/.test(phemail.substring(1))) {
                return res.status(400).json(ReturnPayload({
                    status_code: res.statusCode,
                    message: 'Enter Valid Email',
                    status_message: STATUS_MESSAGE.FAIL,
                }));
            }
            // else if (!phemail.includes('@') && /^\d+$/.test(phemail.substring(1))) {
            //     return res.status(400).json(ReturnPayload({
            //         status_code: res.statusCode,
            //         message: 'Enter Valid Email',
            //         status_message: STATUS_MESSAGE.FAIL,
            //     }));
            // }

            // Create a new user
            const user = new User();
            if (phemail.includes('@')) {
                user.email = phemail
                user.registeredType = "email"
            } else {
                user.phone = phemail
                user.registeredType = "phone"
            }
            user.username = username;
            user.password = password; // The password will be hashed in the User entity

            // Save the user to the database
            let savedUser = await this.userRepo.save(user);

            return res.status(201).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'User registered successfully',
                status_message: STATUS_MESSAGE.SUCCESS
            }));
        } catch (error) {
            res.status(500).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'Internal server error',
                status_message: STATUS_MESSAGE.FAIL,
                error
            }));
        }
    };

    changeAuthType = async (req: Request, res: Response) => {
        try {
            let id: string = req.params.id;
            const { enable } = req.body;

            // Find the user by ID
            const user = await this.userRepo.findOne({
                where: { id }
            });

            if (user) {
                if (user.email && user.phone) {
                    await this.userRepo.update(id, { twoWayAuth: enable });
                    res.status(200).json(ReturnPayload({
                        status_code: res.statusCode,
                        message: 'Two Way Login Modified!',
                        status_message: STATUS_MESSAGE.SUCCESS
                    }));
                } else {
                    res.status(400).json(ReturnPayload({
                        status_code: res.statusCode,
                        message: `Both phone And email must be include!`,
                        status_message: STATUS_MESSAGE.FAIL
                    }));
                }
            } else {
                res.status(400).json(ReturnPayload({
                    status_code: res.statusCode,
                    message: `User Not Found!!`,
                    status_message: STATUS_MESSAGE.FAIL
                }));
            }


        } catch (error) {
            res.status(500).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'Internal server error',
                status_message: STATUS_MESSAGE.FAIL,
                error
            }));
        }
    }

    changePass = async (req: Request, res: Response) => {
        try {
            let id: string = req.params.id;
            const { currentPassword, newPassword } = req.body;

            // Validate input
            if (!currentPassword || !newPassword) {
                return res.status(400).json(ReturnPayload({
                    status_code: res.statusCode,
                    message: 'Current password and new password are required',
                    status_message: STATUS_MESSAGE.FAIL
                }));
            }


            // Find the user by ID
            const user = await this.userRepo.findOne({
                where: { id },
                select: ['id', 'password'], // Explicitly select the password field
            });

            if (!user || !(await user.checkPassword(currentPassword))) {
                return res.status(400).json(ReturnPayload({
                    message: 'Invalid current password',
                    status_message: STATUS_MESSAGE.FAIL,
                    status_code: res.statusCode,
                }));
            }

            // Update the password
            user.password = newPassword;
            await this.userRepo.save(user);

            res.status(200).json(ReturnPayload({
                message: 'Password changed successful',
                status_message: STATUS_MESSAGE.SUCCESS,
                status_code: res.statusCode,
            }));
        } catch (error) {
            res.status(500).json(ReturnPayload({
                status_code: res.statusCode,
                message: 'Internal server error',
                status_message: STATUS_MESSAGE.FAIL,
                error
            }));
        }
    };

    resetPassword = async (req: Request, res: Response) => {
        const { token, newPassword }: ResetPasswordRequestBody = req.body;

        const user: User | null = await this.findUserByResetToken(token);
        if (user && user?.resetPasswordExpires! > new Date()) {
            await this.userRepo.update(user.id, {
                password: (await bcrypt.hash(newPassword, 10)).toString(),
                resetPasswordToken: ''
            })

            return res.status(200).json(ReturnPayload({
                message: 'Password reset successful',
                status_message: STATUS_MESSAGE.SUCCESS,
                status_code: res.statusCode,
            }));
        } else {
            return res.status(400).json(ReturnPayload({
                message: 'Invalid or expired token',
                status_message: STATUS_MESSAGE.FAIL,
                status_code: res.statusCode,
            }));
        }

    };

    findUserByResetToken = async (token: string): Promise<User | null> => {
        return await this.userRepo.findOne({
            where: {
                resetPasswordToken: token
            },
            select: ['id', 'resetPasswordToken', 'resetPasswordExpires']
        });
    };

    forgotPassword = async (req: Request, res: Response) => {
        const { phemail }: ForgotPasswordRequestBody = req.body;

        let user: { id: string } | null;

        if (phemail.includes('@')) {
            user = await this.userRepo.findOne({ where: { email: phemail }, select: ['id'] });
        } else {

            user = await this.userRepo.findOne({ where: { phone: phemail }, select: ['id'] });
        }

        if (!user) {
            return res.status(400).json(ReturnPayload({
                message: 'User not found',
                status_code: res.statusCode,
                status_message: STATUS_MESSAGE.FAIL
            }));
        }

        const token = (await bcrypt.hash(Math.random().toString(), 11)).toString();
        const expires = new Date(Date.now() + (5 * 60 * 1000))

        await this.userRepo.update(user.id, { resetPasswordToken: token, resetPasswordExpires: expires });

        // if (phemail.includes('@')) {
        //     console.log(await sendPasswordResetEmail(phemail, token));
        // }

        res.status(200).json(ReturnPayload({
            message: `Password reset email sent ${token}`,
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS
        }));
    };
}