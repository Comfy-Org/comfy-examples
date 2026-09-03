import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

function required(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local.`);
  }

  return value;
}

export function discordConfig() {
  return {
    token: required("DISCORD_TOKEN"),
    applicationId: required("DISCORD_APPLICATION_ID"),
    guildId: process.env.DISCORD_GUILD_ID,
  };
}

export function comfyConfig() {
  return {
    apiKey: required("COMFY_API_KEY"),
    promptNodeId: required("COMFY_PROMPT_NODE_ID"),
    promptInput: process.env.COMFY_PROMPT_INPUT || "text",
  };
}
