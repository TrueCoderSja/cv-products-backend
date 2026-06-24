import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import productRoutes from "./routes/productRoutes";
import categoryRoutes from "./routes/categoryRoutes";


dotenv.config();

const app = express();

// ---------------------------------------------------------------------------
// Core middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Health check (always useful in real systems)
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "products-api",
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);

// ---------------------------------------------------------------------------
// 404 handler (clean API behavior)
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ---------------------------------------------------------------------------
// Error handler (basic but essential safety net)
// ---------------------------------------------------------------------------
app.use((err: any, _req: express.Request, res: express.Response, _next: any) => {
  console.error("🔥 Unexpected error:", err);

  res.status(500).json({
    message: "Internal server error",
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});