import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import userRoutes from "./router/user.routes.js";
import courseRoutes from "./router/course.route.js";
import paymentRoutes from "./router/payment.route.js";

const app = express();

app.use(express.json({ limit: "10mb" }));
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "https://lms-frontend-f2e4.vercel.app/",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // allow cookies and auth headers
};

app.use(cors(corsOptions));

// corsOptions;
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());

app.use(morgan("dev"));

app.use("/ping", (req, res) => {
  res.send("/pong");
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/payments", paymentRoutes);

app.all(/.*/, (req, res) => {
  console.log("404 hit:", req.originalUrl);
  res.status(404).send("!OOPS PAGE NOT FOUND");
});

export default app;
