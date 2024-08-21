import 'reflect-metadata';

const ROUTE_METADATA_KEY = 'route';

interface RouteDefinition {
    path: string;
    method: 'get' | 'post' | 'put' | 'delete';
    handlerName: string;
}

export const GET = (path: string): MethodDecorator => {
    return (target, propertyKey) => {
        const routes: RouteDefinition[] = Reflect.getMetadata(ROUTE_METADATA_KEY, target.constructor) || [];
        routes.push({
            path,
            method: 'get',
            handlerName: propertyKey as string,
        });
        Reflect.defineMetadata(ROUTE_METADATA_KEY, routes, target.constructor);
    };
};

export const POST = (path: string): MethodDecorator => {
    return (target, propertyKey) => {
        const routes: RouteDefinition[] = Reflect.getMetadata(ROUTE_METADATA_KEY, target.constructor) || [];
        routes.push({
            path,
            method: 'post',
            handlerName: propertyKey as string,
        });
        Reflect.defineMetadata(ROUTE_METADATA_KEY, routes, target.constructor);
    };
};

export const PUT = (path: string): MethodDecorator => {
    return (target, propertyKey) => {
        const routes: RouteDefinition[] = Reflect.getMetadata(ROUTE_METADATA_KEY, target.constructor) || [];
        routes.push({
            path,
            method: 'put',
            handlerName: propertyKey as string,
        });
        Reflect.defineMetadata(ROUTE_METADATA_KEY, routes, target.constructor);
    };
};

export const DELETE = (path: string): MethodDecorator => {
    return (target, propertyKey) => {
        const routes: RouteDefinition[] = Reflect.getMetadata(ROUTE_METADATA_KEY, target.constructor) || [];
        routes.push({
            path,
            method: 'delete',
            handlerName: propertyKey as string,
        });
        Reflect.defineMetadata(ROUTE_METADATA_KEY, routes, target.constructor);
    };
};

// Similarly, you can create @Put, @Delete, and other HTTP method decorators...
