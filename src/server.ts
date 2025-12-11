import { env } from "@config/env/env";
import createApp from "./app";
import dotenv from "dotenv";
import { initializeCronJobs } from "@/modules/common/services/cron.service";

// Load environment variables
dotenv.config();

const port = env.PORT;
const host = env.HOST;

const startServer = async () => {
  try {
    const { server } = await createApp();
    
    server.listen(port,host, () => {
      console.log(`🚀 Server running at: http://localhost:${port}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      
      // Initialize CRON jobs after server starts
      initializeCronJobs();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle process-level events
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Start the server
startServer();