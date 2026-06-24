import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

/**
 * GET /products/categories
 * Returns all categories from Category table
 */
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      data: categories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}