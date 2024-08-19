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
}