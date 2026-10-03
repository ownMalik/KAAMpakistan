import { Request, Response } from 'express';
import prisma from '../config/prisma.ts';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const generateTokens = (user: { id: string; role: string; phone: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, phone: user.phone },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { phone, email, password, fullName, city, area, role } = req.body;

    if (!phone || !password || !fullName) {
      return res.status(400).json({ error: 'Phone, password, and full name are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        phone,
        email,
        passwordHash: hashedPassword,
        fullName,
        city,
        area,
        role: role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER',
      },
    });

    if (user.role === 'PROVIDER') {
      await prisma.providerProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    const tokens = generateTokens(user);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        city: user.city,
      },
      ...tokens,
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid phone number or password.' });
    }

    const tokens = generateTokens(user);

    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
        city: user.city,
      },
      ...tokens,
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};