import app from "./app.js";
import { startNotificationWorker } from "./modules/notifications/notifications.worker.js";

const PORT = process.env.PORT || 5000;

// Start notification worker (processes Bull queue jobs)
startNotificationWorker();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
