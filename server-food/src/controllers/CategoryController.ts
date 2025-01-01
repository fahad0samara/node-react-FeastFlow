import { Request, Response } from 'express';
import { Category, ICategory } from '../models/Category';

export class CategoryController {
  // Get all categories with their subcategories
  static async getAll(req: Request, res: Response) {
    try {
      const categories = await Category.getTree();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch categories',
        message: error.message
      });
    }
  }

  // Get a single category by ID
  static async getById(req: Request, res: Response) {
    try {
      const category = await Category.findById(req.params.id)
        .populate('subCategories');
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      
      res.json(category);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch category',
        message: error.message
      });
    }
  }

  // Create a new category
  static async create(req: Request, res: Response) {
    try {
      const categoryData: Partial<ICategory> = {
        name: req.body.name,
        description: req.body.description,
        image: req.body.image,
        parent: req.body.parentId,
        order: req.body.order,
        isActive: req.body.isActive
      };

      const category = new Category(categoryData);
      await category.save();

      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({
        error: 'Failed to create category',
        message: error.message
      });
    }
  }

  // Update a category
  static async update(req: Request, res: Response) {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const updates: Partial<ICategory> = {
        name: req.body.name,
        description: req.body.description,
        image: req.body.image,
        parent: req.body.parentId,
        order: req.body.order,
        isActive: req.body.isActive
      };

      // Remove undefined values
      Object.keys(updates).forEach(key => 
        updates[key as keyof ICategory] === undefined && delete updates[key as keyof ICategory]
      );

      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      ).populate('subCategories');

      res.json(updatedCategory);
    } catch (error: any) {
      res.status(400).json({
        error: 'Failed to update category',
        message: error.message
      });
    }
  }

  // Delete a category
  static async delete(req: Request, res: Response) {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Check if category has subcategories
      const hasSubCategories = await Category.exists({ parent: category._id });
      if (hasSubCategories) {
        return res.status(400).json({
          error: 'Cannot delete category',
          message: 'Category has subcategories. Please delete or reassign them first.'
        });
      }

      await category.deleteOne();
      res.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to delete category',
        message: error.message
      });
    }
  }

  // Reorder categories
  static async reorder(req: Request, res: Response) {
    try {
      const orders: { id: string; order: number }[] = req.body.orders;
      
      await Promise.all(
        orders.map(({ id, order }) =>
          Category.findByIdAndUpdate(id, { order })
        )
      );

      const updatedCategories = await Category.getTree();
      res.json(updatedCategories);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to reorder categories',
        message: error.message
      });
    }
  }

  // Get menu items by category
  static async getMenuItems(req: Request, res: Response) {
    try {
      const category = await Category.findById(req.params.id);
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Get all subcategories
      const subcategories = await Category.find({ parent: category._id });
      const categoryIds = [category._id, ...subcategories.map(sub => sub._id)];

      const menuItems = await Menu.find({ category: { $in: categoryIds } })
        .populate('category')
        .sort('name');

      res.json(menuItems);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch menu items',
        message: error.message
      });
    }
  }
}
