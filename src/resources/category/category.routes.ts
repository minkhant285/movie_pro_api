import { Router } from 'express';
import { CategoryController } from './category.controller';
export class CategoryRoutes {
    public router: Router;
    public categoryController: CategoryController = new CategoryController();

    constructor() {
        this.router = Router();
        this.routes();
    }

    routes() {
        this.router.get(`/`, this.categoryController.getAllCategory);
        this.router.get(`/search/:query`, this.categoryController.searchCategories);
        this.router.post(`/`, this.categoryController.createCategory);
        this.router.put(`/:id`, this.categoryController.updateCategory);
        this.router.delete(`/:id`, this.categoryController.deleteCategory);
    }
}