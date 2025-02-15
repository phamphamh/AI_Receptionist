import express from "express";
import dotenv from "dotenv";
import webhookRoutes from "./routes/webhook.routes";
import HistoryTracker from "./lib/history";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

export const tracker = new HistoryTracker();

app.use("/api", webhookRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
