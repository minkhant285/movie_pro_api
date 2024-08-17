import { DataSource } from "typeorm";
import { envData } from "../utils/environment";
import { User } from "../resources/user/user.entity";
import { Movie } from "../resources/video/vid.entity";
import { Category } from "../resources/category/category.entity";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: envData.db_host,
    port: envData.db_port,
    username: envData.db_username,
    password: envData.db_pass,
    database: "blue_movie_pro",
    synchronize: true,
    logging: false,
    entities: [User, Category, Movie],
    subscribers: [],
    migrations: [],
});