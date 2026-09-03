import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { discordConfig } from "./config.js";

const config = discordConfig();

const command = new SlashCommandBuilder()
  .setName("imagine")
  .setDescription("Generate an image with Comfy")
  .addStringOption((option) => (
    option
      .setName("prompt")
      .setDescription("What to generate")
      .setMaxLength(1000)
      .setRequired(true)
  ));

const rest = new REST({ version: "10" }).setToken(config.token);
const route = config.guildId
  ? Routes.applicationGuildCommands(config.applicationId, config.guildId)
  : Routes.applicationCommands(config.applicationId);

await rest.put(route, { body: [command.toJSON()] });
console.log("Registered /imagine");
