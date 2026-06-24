import express, { Router } from "express";
import { getProducts } from "../controllers/productsController";
const router: Router = express.Router();

/**
 * GET /products
 * Cursor-based pagination (newest-first)
 *
 * Query params:
 * - limit: number (optional, default 20, max 100)
 * - cursor: string (base64 encoded JSON { createdAt, id })
 */
router.get("/", getProducts);

export default router;