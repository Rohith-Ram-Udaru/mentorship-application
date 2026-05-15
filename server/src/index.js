import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

await connectDb();

const app = createApp();
app.listen(env.port, () => {
  console.log(`MENTORFLOW X API running on http://localhost:${env.port}`);
});
