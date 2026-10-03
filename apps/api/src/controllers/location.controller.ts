import { Request, Response } from 'express';
import prisma from '../config/prisma.ts';

export const getLocations = async (req: Request, res: Response) => {
  try {
    const cities = await prisma.city.findMany({
      include: {
        areas: true,
      },
    });
    return res.json({ cities });
  } catch (error: any) {
    console.error('Get Locations Error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching locations.' });
  }
};

export const createCity = async (req: Request, res: Response) => {
  try {
    const { name, province } = req.body;
    if (!name || !province) {
      return res.status(400).json({ error: 'City name and province are required.' });
    }

    const city = await prisma.city.create({
      data: { name, province },
    });

    return res.status(201).json({ message: 'City created successfully', city });
  } catch (error: any) {
    console.error('Create City Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating city.' });
  }
};

export const createArea = async (req: Request, res: Response) => {
  try {
    const { name, cityId } = req.body;
    if (!name || !cityId) {
      return res.status(400).json({ error: 'Area name and cityId are required.' });
    }

    const area = await prisma.area.create({
      data: { name, cityId },
    });

    return res.status(201).json({ message: 'Area created successfully', area });
  } catch (error: any) {
    console.error('Create Area Error:', error);
    return res.status(500).json({ error: 'Internal server error while creating area.' });
  }
};