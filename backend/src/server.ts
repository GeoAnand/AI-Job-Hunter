
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "AI Job Hunter API is running",
    status: "success"
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "AI Job Hunter Backend",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/jobs", (_req, res) => {
  res.json({
    jobs: [],
    total: 0,
    message: "Job discovery will be connected in the next phase."
  });
});

app.listen(PORT, () => {
  console.log(`AI Job Hunter API running at http://localhost:${PORT}`);
});
