import { Router } from 'express';
import 'reflect-metadata';
import { DecoController } from './controller';

interface RouteDefinition {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete';
    handlerName: string;
}

export class DecoCategoryRoutes {
    public router: Router;
    public categoryController: DecoController = new DecoController();

    constructor() {
        this.router = Router();
        this.initRoutes();
    }

    private initRoutes() {
        const controllerPrototype = Object.getPrototypeOf(this.categoryController);
        const routes: RouteDefinition[] = Reflect.getMetadata('route', controllerPrototype.constructor) || [];

        routes.forEach((route) => {
            const method = route.method as keyof Router; // This ensures TypeScript understands the method
            //@ts-ignore
            this.router[method](route.path, this.categoryController[route.handlerName].bind(this.categoryController));
        });
    }
}

