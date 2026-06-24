import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

function isValidDate(d: any): boolean {
  const date = new Date(d);
  return !isNaN(date.getTime());
}

function parseCursor(cursorRaw?: string) {
  if (!cursorRaw) return undefined;

  try {
    const decoded = JSON.parse(
      Buffer.from(cursorRaw, "base64").toString()
    );

    if (!decoded.id || !isValidDate(decoded.createdAt)) {
      return null;
    }

    return {
      id: String(decoded.id),
      createdAt: new Date(decoded.createdAt),
    };
  } catch {
    return null;
  }
}

export async function getProducts(req: Request, res: Response) {
  try {
    // ---------------------------------------------------------------------
    // 🔢 LIMIT
    // ---------------------------------------------------------------------
    const rawLimit = Number(req.query.limit);
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, 100)
        : 20;

    // ---------------------------------------------------------------------
    // 📦 CATEGORY (NOW USE categoryId)
    // ---------------------------------------------------------------------
    const categoryId = req.query.categoryId as string | undefined;

    // ---------------------------------------------------------------------
    // 🔎 SEARCH
    // ---------------------------------------------------------------------
    const qRaw = req.query.q as string | undefined;
    const q = qRaw?.trim() || undefined;

    // ---------------------------------------------------------------------
    // 📅 DATE FILTER
    // ---------------------------------------------------------------------
    const startDateRaw = req.query.startDate as string | undefined;
    const endDateRaw = req.query.endDate as string | undefined;

    const startDate =
      startDateRaw && isValidDate(startDateRaw)
        ? new Date(startDateRaw)
        : undefined;

    const endDate =
      endDateRaw && isValidDate(endDateRaw)
        ? new Date(endDateRaw)
        : undefined;

    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({
        message: "startDate cannot be greater than endDate",
      });
    }

    // ---------------------------------------------------------------------
    // 🧭 CURSOR
    // ---------------------------------------------------------------------
    const cursor = parseCursor(req.query.cursor as string | undefined);

    if (req.query.cursor && cursor === null) {
      return res.status(400).json({ message: "Invalid cursor" });
    }

    // ---------------------------------------------------------------------
    // 📦 QUERY (UPDATED RELATIONAL VERSION)
    // ---------------------------------------------------------------------
    const products = await prisma.product.findMany({
      take: limit + 1,

      ...(cursor && {
        cursor: {
          id: cursor.id,
        },
        skip: 1,
      }),

      where: {
        ...(categoryId ? { categoryId } : {}),

        ...(q
          ? {
              name: {
                contains: q,
                mode: "insensitive",
              },
            }
          : {}),

        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },

      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],

      // 🧠 JOIN CATEGORY DATA
      include: {
        category: true,
      },
    });

    // ---------------------------------------------------------------------
    // 🧭 NEXT CURSOR
    // ---------------------------------------------------------------------
    let nextCursor: string | null = null;

    if (products.length > limit) {
      const nextItem = products.pop();

      nextCursor = Buffer.from(
        JSON.stringify({
          id: nextItem!.id,
          createdAt: nextItem!.createdAt,
        })
      ).toString("base64");
    }

    res.json({
      data: products,
      nextCursor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}