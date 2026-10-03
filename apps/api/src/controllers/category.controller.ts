import { Request, Response } from 'express';
import prisma from '../config/prisma.ts';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subcategories: {
          include: {
            services: true,
          },
        },
      },
    });
    return res.json({ categories });
  } catch (error: any) {
    console.error('Get Categories Error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching categories.' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, icon } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug are required.' });
    }

    const category = await prisma.category.create({
      data: { name, slug, icon },
    });

    return res.status(201).json({ message: 'Category created successfully', category });
  } catch (error: any) {
    console.error('Create Category Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating category.' });
  }
};

export const createSubcategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, categoryId } = req.body;
    if (!name || !slug || !categoryId) {
      return res.status(400).json({ error: 'Name, slug, and categoryId are required.' });
    }

    const subcategory = await prisma.subcategory.create({
      data: { name, slug, categoryId },
    });

    return res.status(201).json({ message: 'Subcategory created successfully', subcategory });
  } catch (error: any) {
    console.error('Create Subcategory Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating subcategory.' });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const { name, slug, subcategoryId } = req.body;
    if (!name || !slug || !subcategoryId) {
      return res.status(400).json({ error: 'Name, slug, and subcategoryId are required.' });
    }

    const service = await prisma.service.create({
      data: { name, slug, subcategoryId },
    });

    return res.status(201).json({ message: 'Service created successfully', service });
  } catch (error: any) {
    console.error('Create Service Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating service.' });
  }
};