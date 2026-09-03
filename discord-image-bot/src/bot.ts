import { Client, EmbedBuilder, Events, GatewayIntentBits } from "discord.js";
import { generateImage } from "./comfy.js";
import { discordConfig } from "./config.js";

const config = discordConfig();
const DISCORD_REPLY_TIMEOUT_MS = 14 * 60 * 1000;

const bot = new Client({ intents: [GatewayIntentBits.Guilds] });

bot.once(Events.ClientReady, (client) => {
  console.log(`Ready as ${client.user.tag}`);
});

bot.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "imagine") {
    return;
  }

  await interaction.deferReply();
  const prompt = interaction.options.getString("prompt", true);
  try {
    const result = await generateImage(prompt, AbortSignal.timeout(DISCORD_REPLY_TIMEOUT_MS));
    await interaction.editReply({
      content: prompt,
      allowedMentions: { parse: [] },
      embeds: [new EmbedBuilder().setImage(result.url)],
    });
  } catch (error) {
    console.error("Comfy job failed", error);
    await interaction.editReply("Image generation failed. Please try again.");
  }
});

bot.login(config.token);
