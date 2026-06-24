import express from "express";
import { getCategories } from "../controllers/categoryController";

const router = express.Router();

/**
 * 🏷️ Distinct categories for filters
 */
router.get("/", getCategories);

export default router;