import { createPrompt } from 'bun-promptx'
import { schedule } from "node-cron";
import { MatchaChecker } from "./matcha-checker";

let input: { value: string | null, error: string | null } = {
  value: "",
  error: null
}

for (; ;) {
  if (!input.value) {
    input = createPrompt("Enter URL (q to quit):", {
      required: true,
    })

    if (input.value === 'q') process.exit(0)

    try {
      new URL(input.value as string)
    } catch (e) {
      console.log("Invalid URL")
      input.value = null
    }
  } else {
    console.log("Setting up CRON to check ✅")
    console.log("Will check every 30 seconds")
    break;
  };
}
// Run every 30 seconds using seconds field
schedule("*/30 * * * * *", async () => {
  const checker = new MatchaChecker();
  await checker.run(input.value as string); // Use run() instead of checkAvailability() to get notifications
});
