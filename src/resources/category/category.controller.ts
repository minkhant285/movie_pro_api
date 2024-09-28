import { Request, Response } from 'express';
import { Like, Repository } from 'typeorm';
import { Category } from './category.entity';
import { AppDataSource, ReturnPayload, STATUS_MESSAGE } from '../../utils';
import { Movie } from '../video/vid.entity';

type CreateCategoryProps = {
    name: string;
    description: string;
    movies?: Movie[];
}

export class CategoryController {
    private categoryRepo: Repository<Category>;

    constructor() {
        this.categoryRepo = AppDataSource.getRepository(Category);
    }


    getAllCategory = async (req: Request, res: Response) => {
        const categories = await this.categoryRepo.find({ relations: { movies: true } });

        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: categories
        }));
    };

    getCategoryById = async (req: Request, res: Response) => {
        let id: string = req.params.id;
        let category = await this.categoryRepo.findOne({
            where: { id }, relations: {
                movies: true
            }
        });
        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: category
        }));
    };

    searchCategories = async (req: Request, res: Response) => {
        let query: string = req.params.query;

        const [categories, total] = await this.categoryRepo.findAndCount({
            where: { name: Like(`%${query}%`) }
        });
        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: { categories, total }
        }));
    };

    updateCategory = async (req: Request, res: Response) => {
        let id: string = req.params.id;
        let body = req.body ?? null;
        let updated = await this.categoryRepo.update(id, body);
        if (updated.affected !== 1) {
            return res.status(500).json({
                data: updated,
                status: res.statusCode
            })
        }
        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: updated
        }));
    };

    deleteCategory = async (req: Request, res: Response) => {
        const id: string = req.params.id; // get the user id from req.params
        const deleted = await this.categoryRepo.findOne({ where: { id }, relations: { movies: true } });

        if (deleted && deleted?.movies.length > 0) {
            return res.status(200).json(ReturnPayload({
                message: 'Cannot Delete! Please Remove Connected Video First',
                status_code: res.statusCode,
                status_message: STATUS_MESSAGE.FAIL,

            }))
        }

        return res.status(200).json(ReturnPayload({
            message: 'Successfully Deleted!',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: "Deleted"
        }));
    };

    createCategory = async (req: Request, res: Response) => {
        let body = req.body as CreateCategoryProps;
        const created = await this.categoryRepo.save(body);
        // return response
        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: created
        }));
    };
}