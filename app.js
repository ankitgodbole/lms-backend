import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import userRoutes from "./router/user.routes.js";
import courseRoutes from "./router/course.route.js";
import paymentRoutes from "./router/payment.route.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// ✅ CORS setup
const allowedOrigins = [
  "http://localhost:5173", // Vite dev
  process.env.FRONTEND_URL || "", // Vercel deployed frontend
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // allow cookies/auth headers
};

app.use(cors(corsOptions));

// ✅ Root route for health check
app.get("/", (req, res) => {
  res.send("Backend API is running 🚀");
});

// ✅ Ping route
app.use("/ping", (req, res) => {
  res.send("pong 🏓");
});

// ✅ API Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/payments", paymentRoutes);

// ✅ 404 fallback
app.all(/.*/, (req, res) => {
  console.log("404 hit:", req.originalUrl);
  res.status(404).send("!OOPS PAGE NOT FOUND");
});

export default app;
