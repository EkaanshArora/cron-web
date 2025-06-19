// Create CRON job to run the script every 30 seconds

import { schedule } from "node-cron";
import { MatchaChecker } from "./matcha-checker";

// Run every 30 seconds using seconds field
schedule("*/30 * * * * *", async () => {
  const checker = new MatchaChecker();
  await checker.run(); // Use run() instead of checkAvailability() to get notifications
});
