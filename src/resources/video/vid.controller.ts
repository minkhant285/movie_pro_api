import { Request, Response } from 'express';
import { Like, Repository } from 'typeorm';
import { AppDataSource, envData, ReturnPayload, STATUS_MESSAGE, uploadToS3 } from '../../utils';
import { Movie } from './vid.entity';
import { User } from '../user/user.entity';
import { Category } from '../category/category.entity';
import { generateThumbnailAndUploadToS3 } from '../../utils/ffmpeg';
import { Server } from '../..';
import { validate } from 'uuid';
import { VideoService } from './vid.service';

export type MovieUpdateProp = {
    name: string;
    caption: string;
    description: string;
    url: string;
    likes?: number;
    view_count?: number;
    thumbnail_url?: string;
}

export type MovieCreateProp = {
    categories?: Category[];
    favourites?: User[];
    created_user?: Partial<User>;
} & MovieUpdateProp;

export class MovieController {
    private userRepo: Repository<User>;
    private cateogryRepo: Repository<Category>;
    private movieRepo: Repository<Movie>;
    private videoService: VideoService;


    constructor() {
        this.userRepo = AppDataSource.getRepository(User);
        this.cateogryRepo = AppDataSource.getRepository(Category);
        this.movieRepo = AppDataSource.getRepository(Movie);
        this.videoService = new VideoService();
    }




    getAllMovies = async (req: Request, res: Response) => {
        let movies = await this.movieRepo.find({ relations: { categories: true, created_user: true } });

        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: movies
        }));
    };

    uploadVideo = async (req: Request, res: Response) => {
        // let id: string = req.params.movie_id as string;
        const socketId = req.headers['x-socket-id']; // Get socket ID from headers
        const server = new Server();

        if (!socketId) {
            return res.status(400).send('Socket ID is missing');
        }

        const uploadMiddleware = uploadToS3.single('file');

        uploadMiddleware(req, res, async (err) => {
            if (err) {
                server.io.to(socketId as string).emit('uploadProgress', { progress: 0, error: err.message });
                return res.status(500).send('File upload failed');
            }

            if (req.file) {
                const fileUrl = (req.file as any).location;
                server.io.to(socketId as string).emit('uploadProgress', { progress: 100, url: fileUrl });
                const { s3Url } = await generateThumbnailAndUploadToS3(fileUrl, `thumbnail-${Date.now().toString()}` as string);
                return res.status(200).json(ReturnPayload({
                    message: 'Video Uploaded!',
                    status_code: res.statusCode,
                    status_message: STATUS_MESSAGE.SUCCESS,
                    result: {
                        fileUrl,
                        thumbnail_url: s3Url
                    }
                }));

            } else {
                server.io.to(socketId as string).emit('uploadProgress', { progress: 0, error: 'File upload failed' });
                res.status(400).send('File upload failed');
            }
        });

    }

    // uploadVideo = async (req: Request, res: Response) => {
    //     let id: string = req.params.movie_id as string;
    //     const fileUrl = (req.file as any).location;
    //     // '00:01:30'; // HH:MM:SS format (e.g., 1 minute and 30 seconds into the video)
    //     // const poster_url = await generateThumbnail(fileUrl, `${req.file?.filename}.png` as string)
    //     const { s3Url, width, height } = await generateThumbnailAndUploadToS3(fileUrl, `thumbnail-${Date.now().toString()}` as string)
    //     // console.log(poster_url);
    //     let updated = await this.movieRepo.update(id, {
    //         url: fileUrl,
    //         thumbnail_url: s3Url
    //     });
    //     if (updated.affected !== 1) {
    //         return res.status(400).json(ReturnPayload({
    //             message: 'Something Wrong In Uploading Video',
    //             status_code: res.statusCode,
    //             status_message: STATUS_MESSAGE.FAIL
    //         }))
    //     }
    //     return res.status(200).json(ReturnPayload({
    //         message: 'Video Uploaded!',
    //         status_code: res.statusCode,
    //         status_message: STATUS_MESSAGE.SUCCESS,
    //         result: {
    //             fileUrl,
    //             thumbnail_url: s3Url
    //         }
    //     }));
    // }

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

        if (!validate(movie_id)) {
            return res.status(400).json(ReturnPayload({
                message: 'Enter Valid Video ID!',
                status_code: res.statusCode,
                status_message: STATUS_MESSAGE.FAIL,
            }));
        }
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
        const movies = await this.movieRepo.createQueryBuilder('movie')
            .leftJoinAndSelect('movie.categories', 'categories') // Include the relation
            .where('LOWER(movie.name) LIKE LOWER(:name)', { name: `%${query}%` })
            .orWhere('LOWER(movie.caption) LIKE LOWER(:caption)', { caption: `%${query}%` })
            .getMany();

        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: movies
        }));
    };

    createMovie = async (req: Request, res: Response) => {
        const body = req.body as MovieCreateProp;
        body.created_user = { id: req.params.id as string };
        const result = await this.videoService.saveVideo(body);
        // return response
        return res.status(200).json(ReturnPayload({
            message: '',
            status_code: res.statusCode,
            status_message: STATUS_MESSAGE.SUCCESS,
            result: result
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