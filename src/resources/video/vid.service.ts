import { Like, Repository } from "typeorm";
import { Movie } from "./vid.entity";
import { AppDataSource } from "../../utils";
import { MovieCreateProp } from "./vid.controller";
import { Category } from "../category/category.entity";

export class VideoService {
    private movieRepo: Repository<Movie>;


    constructor() {
        // this.userRepo = AppDataSource.getRepository(User);
        // this.cateogryRepo = AppDataSource.getRepository(Category);
        this.movieRepo = AppDataSource.getRepository(Movie);
    }


    saveVideo = async (movieBody: MovieCreateProp) => {
        const created = await this.movieRepo.save(movieBody);
        return created;
    }

    addViewCount = async (mv_id: string) => {
        const movie = await this.movieRepo.findOne({ where: { id: mv_id } });
        if (movie) {
            await this.movieRepo.update(mv_id, { view_count: movie.view_count + 1 })
        }
        return movie?.view_count;
    }



    getVideosByPage = async (page: number, limit: number, filter_name?: string) => {
        const skip = (page - 1) * limit;
        let movies, total;
        if (filter_name) {
            const res = await this.movieRepo
                .createQueryBuilder('movie')
                .leftJoinAndSelect('movie.categories', 'category')
                .leftJoinAndSelect('movie.created_user', 'created_user')
                .where('LOWER(category.name) LIKE LOWER(:filter_name)', { filter_name: `${filter_name}` })
                .orderBy('movie.created_at', 'DESC')
                .skip(skip)
                .take(limit)
                .getManyAndCount();
            movies = res[0];
            total = res[1];

        } else {
            const res = await this.movieRepo.findAndCount({
                relations: { categories: true, created_user: true },
                take: limit, skip,
                order: {
                    created_at: 'DESC'
                }
            });
            movies = res[0];
            total = res[1];
        }
        return { movies, total, page, limit };

    };

    checkMovieNameExist = async (name: string) => {
        const movieCheck = await this.movieRepo.findOne({ where: { name } });
        return movieCheck;
    }

}