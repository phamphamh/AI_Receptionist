import express from "express";
import dotenv from "dotenv";
import webhookRoutes from "./routes/webhook.routes";
import { sessionManager } from "./lib/history";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", webhookRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export { sessionManager };
