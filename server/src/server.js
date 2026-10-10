import { app } from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/environment.js';

const startServer = async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`[ExamEase Server] Running on http://localhost:${config.port}`);
      console.log(`[ExamEase Server] Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error(`[ExamEase Server] Startup failure: ${error.message}`);
    process.exit(1);
  }
};

startServer();
