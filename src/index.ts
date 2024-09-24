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
import { Server as SocketServer } from 'socket.io';
import http from 'http';
import { DecoCategoryRoutes } from './resources/decocategory/routes';



const options: cors.CorsOptions = {
    origin: ['https://mgzaw.com', 'http://localhost:5173', 'http://itverse:5173', 'http://localhost:5000', 'http://itverse:5000', 'http://192.168.100.5:5173', 'https://www.mgzaw.com'],  // Allow only your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization', 'x-socket-id'],  // Allow custom headers
};

const apiPrefix = '/api/v1';
export class Server {
    public app: express.Application;
    public server: http.Server;
    // public io: SocketServer;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        // this.io = new SocketServer(this.server, { cors: { origin: ['https://mgzaw.com', 'http://localhost:5173', 'http://itverse:5173', 'http://localhost:5000', 'http://itverse:5000', 'http://192.168.100.5:5173', 'https://www.mgzaw.com'], } });
    }

    private config() {
        this.app.set("port", envData.app_port || 50001);
        this.app.use(cors(options));
        this.app.options('*', cors(options));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
    }

    public routes(): void {
        this.app.get("/", (req, res) => res.send('Mgzaw Video API V1.0'))
        // this.app.get('/', (req, res) => {
        //     res.sendFile(__dirname + '/test.html');
        // });

        // this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
        this.app.use("/image", express.static(path.join(__dirname, 'assets/images')));
        this.app.use("/video", express.static(path.join(__dirname, 'assets/videos')));
        this.app.use(`${apiPrefix}/user`, new UserRoutes().router);
        this.app.use(`${apiPrefix}/auth`, new AuthRoutes().router);
        this.app.use(`${apiPrefix}/movie`, new MovieRoutes().router);
        this.app.use(`${apiPrefix}/category`, new CategoryRoutes().router);
        this.app.use(`${apiPrefix}/deco`, new DecoCategoryRoutes().router);
        this.app.use((req, res, next) => {
            const error = new Error('No Route Found');
            return res.status(404).json({
                message: error.message
            });
        });

    }

    public start(): void {
        this.config();
        this.routes();
        this.DBinit();
        // this.SocketServerConnection()
        this.app.listen(this.app.get("port"), () => {
            // this.io.listen(50002);
            console.log(`ITVerse API Service is Running ${this.app.get("port")}`)
        })
    }

    // private async SocketServerConnection() {
    //     this.io.on('connection', (socket) => {
    //         console.log('a user connected');
    //         socket.on('disconnect', () => {
    //             console.log('user disconnected');
    //         });
    //     });
    // }

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