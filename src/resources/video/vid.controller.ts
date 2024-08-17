import { Request, Response } from 'express';
import { Like, Repository } from 'typeorm';
import { AppDataSource, envData, ReturnPayload, STATUS_MESSAGE } from '../../utils';
import { Movie } from './vid.entity';
import { User } from '../user/user.entity';
import { Category } from '../category/category.entity';
import { File } from 'buffer';
import path from 'path';
import { uploadFileToS3 } from '../../utils/s3_helper';
import { generateThumbnail } from '../../utils/ffmpeg';

type MovieUpdateProp = {
    name: string;
    caption: string;
    description: string;
    url: string;
    likes?: number;
    view_count?: number;
    thumbnail_url?: string;
}

type MovieCreateProp = {
    categories?: Category[];
    favourites?: User[];
} & MovieUpdateProp;

export class MovieController {
    private userRepo: Repository<User>;
    private cateogryRepo: Repository<Category>;
    private movieRepo: Repository<Movie>;

    constructor() {
        this.userRepo = AppDataSource.getRepository(User);
        this.cateogryRepo = AppDataSource.getRepository(Category);
        this.movieRepo = AppDataSource.getRepository(Movie);
    }


    getAllMovies = async (req: Request, res: Response) => {
        let movies = await this.movieRepo.find({ relations: ['categories'] });

        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: movies
        }));
    };

    uploadVideo = async (req: Request, res: Response) => {
        let id: string = req.params.movie_id as string;
        const fileUrl = (req.file as any).location;
        // '00:01:30'; // HH:MM:SS format (e.g., 1 minute and 30 seconds into the video)
        // const poster_url = await generateThumbnail(fileUrl, `${req.file?.filename}.png` as string)
        await generateThumbnail(fileUrl, `${req.file?.filename}.png` as string)
        // console.log(poster_url);
        let updated = await this.movieRepo.update(id, {
            url: fileUrl,
            // thumbnail_url: poster_url
        });
        if (updated.affected !== 1) {
            return res.status(400).json(ReturnPayload({
                message: 'Something Wrong In Uploading Video',
                status_code: res.statusCode,
                status_message: STATUS_MESSAGE.FAIL
            }))
        }
        return res.status(200).json(ReturnPayload({
            message: 'Video Uploaded!',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: fileUrl
        }));
    }

    getMoviesByCategory = async (req: Request, res: Response) => {
        const category_id = req.params.category_id as string;
        let movies = await this.cateogryRepo.findOne({ where: { id: category_id }, relations: { movies: true } });

        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: movies
        }));
    };

    getMoviebyID = async (req: Request, res: Response) => {
        const movie_id = req.params.movie_id as string;
        const movie = await this.movieRepo.findOne({ where: { id: movie_id }, relations: ['categories'] });

        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: movie
        }));
    };

    searchMovie = async (req: Request, res: Response) => {
        const query = req.params.query as string;
        let movies = await this.movieRepo.find({
            where: [
                { name: Like(`%${query}%`) },
                { caption: Like(`%${query}%`) },
                { description: Like(`%${query}%`) }
            ]
            , relations: ['categories']
        });

        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: movies
        }));
    };

    createMovie = async (req: Request, res: Response) => {
        const body = req.body as MovieCreateProp;
        const created = await this.movieRepo.save(body);
        // return response
        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: created
        }));
    };

    deleteMovie = async (req: Request, res: Response) => {
        const movie_id = req.params.movie_id as string;
        const deleted = await this.movieRepo.delete(movie_id);
        // return response
        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: deleted
        }));
    };

    updateMovie = async (req: Request, res: Response) => {
        //  "id": "abd00e7c-6739-4545-8d8b-3b95642d39ef"
        const movie_id = req.params.movie_id as string;
        const body = req.body as Partial<MovieUpdateProp>;
        const created = await this.movieRepo.update(movie_id, {
            caption: body.caption,
            name: body.name,
            url: body.url,
            description: body.description,
            thumbnail_url: body.thumbnail_url
        });
        // return response
        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: created
        }));
    }

    addCategory = async (req: Request, res: Response) => {
        const movie_id = req.params.movie_id as string;
        const body = req.body as Category;
        const movie = await this.movieRepo.findOne({ where: { id: movie_id }, relations: { categories: true } })
        if (movie) {
            if (!movie.categories.some(a => a.id === body.id)) {
                movie.categories.push(body);
                await this.movieRepo.save(movie);
                return res.status(201).json(ReturnPayload({
                    message: 'Saved',
                    status_code: res.statusCode,
                    status_message: STATUS_MESSAGE.SUCCESS
                }));
            }
        }
        return res.status(400).json(ReturnPayload({
            message: 'Video Not Found!',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.FAIL,
        }));
    }


    removeCategory = async (req: Request, res: Response) => {
        const movie_id = req.params.movie_id as string;
        const body = req.body as Category;
        const movie = await this.movieRepo.findOne({ where: { id: movie_id }, relations: { categories: true } })

        if (movie) {
            movie.categories = movie.categories.filter(c => c.id !== body.id);
            await this.movieRepo.save(movie);

            return res.status(201).json(ReturnPayload({
                message: 'Removed',
                status_code: res.statusCode,
                status_message: STATUS_MESSAGE.SUCCESS
            }));

        }
        return res.status(400).json(ReturnPayload({
            message: 'Video Not Found!',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.FAIL,
        }));
    }


}