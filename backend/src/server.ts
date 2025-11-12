import "reflect-metadata";
import { createApp } from "./app";
import { AppDataSource } from "./config/data-source";
import { env } from "./config/env";
import { BookingService } from "./services/BookingService";
import { seedMockData } from "./config/seedData";

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    await seedMockData();

    const app = createApp();
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    });

    setInterval(() => {
      BookingService.releaseExpiredHolds().catch(() => { });
    }, 15_000);
  } catch (err) {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  }
}

bootstrap();
