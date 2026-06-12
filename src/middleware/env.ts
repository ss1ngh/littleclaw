// src/middleware/env.ts
//
// Validates required environment variables at startup.
// If anything is missing, prints a clear error and exits immediately
// — so you don't get cryptic runtime crashes later.

const REQUIRED_ENV_VARS = [
  "TELEGRAM_BOT_TOKEN",
  "OPENROUTER_API_KEY",
] as const;

function validateEnv() {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    for (const envVar of missing) {
      console.error(`   - ${envVar}`);
    }
    console.error("");
    console.error("Add these to your .env file:");
    console.error(`   ${missing.map((v) => `${v}=your_value_here`).join("\n   ")}`);
    console.error("");
    process.exit(1);
  }

  console.log("All environment variables loaded successfully");
}

// Run validation immediately when this file is imported
validateEnv();
