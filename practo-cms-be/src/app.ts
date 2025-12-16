/**
 * Practo Hub CMS - Express Application
 * 
 * Main application configuration with all routes
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import topicRoutes from "./modules/topics/topics.routes.js";
import scriptRoutes from "./modules/scripts/scripts.routes.js";
import videoRoutes from "./modules/videos/videos.routes.js";
import doctorPointerRoutes from "./modules/doctor-pointers/doctor-pointers.routes.js";
import commentRoutes from "./modules/comments/comments.routes.js";
import hubRoutes from "./modules/videos/hub.routes.js";
import notificationRoutes from "./modules/notifications/notifications.routes.js";

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// URL encoded parser
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "Practo Hub CMS API",
    version: "1.0.0",
    status: "running"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// User management routes
app.use("/api/users", userRoutes);

// Topic management routes
app.use("/api/topics", topicRoutes);

// Script management routes
app.use("/api/scripts", scriptRoutes);

// Video management routes
app.use("/api/videos", videoRoutes);

// Doctor pointer routes
app.use("/api/doctor-pointers", doctorPointerRoutes);

// Comment routes
app.use("/api/comments", commentRoutes);

// Notification routes
app.use("/api/notifications", notificationRoutes);

// Public Hub API (for mobile app)
app.use("/api/v1/hub", hubRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Endpoint not found",
    path: req.path
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', err);
  
  // Handle Prisma errors
  if (err.code?.startsWith('P')) {
    return res.status(400).json({
      success: false,
      message: 'Database error',
      code: err.code
    });
  }
  
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal server error'
  });
});

export default app;
