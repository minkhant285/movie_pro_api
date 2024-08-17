import express from 'express';
import { envData } from './utils/environment';
import cors from 'cors';
import "reflect-metadata"
import path from 'path';
import { AppDataSource } from './utils';
import { AuthRoutes, UserRoutes } from './resources';
import { swaggerUi, swaggerSpec } from './swagger/swaggerConfig';
import { MovieRoutes } from './resources/video/vid.routes';
import { CategoryRoutes } from './resources/category/category.routes';

const options: cors.CorsOptions = {
    origin: '*'
};
const apiPrefix = '/api/v1';
class Server {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
        this.DBinit();
    }

    private config() {
        this.app.set("port", envData.app_port || 50001);
        this.app.use(cors(options));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
    }

    public routes(): void {
        this.app.get("/", (req, res) => res.send('Base API V1.0'))
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        this.app.use("/image", express.static(path.join(__dirname, 'assets/images')));
        this.app.use("/video", express.static(path.join(__dirname, 'assets/videos')));
        this.app.use(`${apiPrefix}/user`, new UserRoutes().router);
        this.app.use(`${apiPrefix}/auth`, new AuthRoutes().router);
        this.app.use(`${apiPrefix}/movie`, new MovieRoutes().router);
        this.app.use(`${apiPrefix}/category`, new CategoryRoutes().router);
        this.app.use((req, res, next) => {
            const error = new Error('No Route Found');
            return res.status(404).json({
                message: error.message
            });
        });

    }

    public start(): void {
        this.app.listen(this.app.get("port"), () => {
            console.log(`ITVerse API Service is Running`, this.app.get("port"))
        })
    }

    private async DBinit() {
        try {
            const db = await AppDataSource.initialize();
            if (db.isInitialized) console.log("DB Connected!!");
        } catch (err) {
            console.log(err);
        }
    }
}

const server = new Server();
server.start();