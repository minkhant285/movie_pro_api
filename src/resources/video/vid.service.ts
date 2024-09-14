import { Repository } from "typeorm";
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



    getVideosByPage = async (page: number, limit: number, filter_id?: string) => {
        const skip = (page - 1) * limit;
        let movies, total;
        if (filter_id) {
            const res = await this.movieRepo.findAndCount({
                relations: { categories: true, created_user: true },
                where: { categories: { id: filter_id } },
                take: limit, skip
            });
            movies = res[0];
            total = res[1];

        } else {
            const res = await this.movieRepo.findAndCount({
                relations: { categories: true, created_user: true },
                take: limit, skip
            });
            movies = res[0];
            total = res[1];
        }
        return { movies, total, page, limit };

    };

}