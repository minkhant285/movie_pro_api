import { GET, POST, DELETE, PUT } from './decorators';
import { Request, Response } from 'express';

export class DecoController {

    @GET('/')
    public getAllCategory(req: Request, res: Response) {
        res.send('Get all categories');
    }

    @GET('/search/:query')
    public searchCategories(req: Request, res: Response) {
        res.send(`Search categories with query: ${req.params.query}`);
    }

    @POST('/')
    public createCategory(req: Request, res: Response) {
        res.json({ result: req.body, message: 'Create a category ' });
    }

    @PUT("/:id")
    public UpdateCategory(req: Request, res: Response) {
        res.send(`Update a category ${req.params.id}`);
    }

    @DELETE("/:id")
    public DeleteCategory(req: Request, res: Response) {
        res.send(`Delete a category ${req.params.id}`);
    }

}
