import { Router } from 'express';
import { authenticateJWT, uploadToS3 } from '../../utils';
import { MovieController } from './vid.controller';
export class MovieRoutes {
    public router: Router;
    private movieController: MovieController = new MovieController();

    constructor() {
        this.router = Router();
        this.routes();
    }

    routes() {
        this.router.get(`/`, this.movieController.getAllMovies);
        this.router.post(`/`, authenticateJWT, this.movieController.createMovie);
        this.router.get(`/:movie_id`, this.movieController.getMoviebyID);
        this.router.get(`/category/:category_id`, this.movieController.getMoviebyID);
        this.router.get(`/search/:query`, this.movieController.searchMovie);
        this.router.put(`/:movie_id`, authenticateJWT, this.movieController.updateMovie);
        this.router.delete(`/:movie_id`, authenticateJWT, this.movieController.deleteMovie);
        this.router.put(`/category/add/:movie_id`, authenticateJWT, this.movieController.addCategory);
        this.router.put(`/category/remove/:movie_id`, authenticateJWT, this.movieController.removeCategory);
        this.router.post(`/upload`, this.movieController.uploadVideo);
    }
}