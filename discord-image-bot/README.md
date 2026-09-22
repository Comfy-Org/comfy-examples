# Comfy Discord image bot

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples)

## Purpose

This sample is a Discord `/imagine` bot that runs a Comfy text-to-image workflow and replies with the generated image. It runs as a Render Background Worker; it has no browser UI.

## Setup and environment variables

Requires Node.js 22+, a Discord application and bot, and a Comfy API key.

Create a Discord application in the [Developer Portal](https://discord.com/developers/applications). Copy its Application ID and bot token. Under **Installation**, enable `applications.commands` and `bot`, allow **Send Messages** and **Embed Links**, then install it in a test server. Keep the bot token private.

From this directory, create the local environment file and install dependencies:

```bash
cp .env.example .env.local
npm ci
```

Fill in these values in `.env.local`:

| Variable | Required | Value |
| --- | --- | --- |
| `DISCORD_TOKEN` | Yes | Token for the Discord bot. |
| `DISCORD_APPLICATION_ID` | Yes | Application ID from the Developer Portal. |
| `COMFY_API_KEY` | Yes | Comfy API key. |
| `COMFY_PROMPT_NODE_ID` | Yes | Prompt input node in the workflow; `30:19` for the bundled workflow. |
| `COMFY_PROMPT_INPUT` | Yes for bundled workflow | Input name; use `value` for the bundled workflow. |
| `DISCORD_GUILD_ID` | No | Test server ID for immediate guild command registration. Omit to register globally. |
| `COMFY_BASE_URL` | No | Comfy endpoint override; defaults to Comfy Cloud. |

The `.env.example` contains the bundled workflow's prompt node and input values. Keep `.env.local` and all credentials out of Git.

## Register and run

Run these commands from `discord-image-bot/` after configuring `.env.local`:

```bash
npm run register
npm run dev
```

`register` creates the `/imagine` command. With `DISCORD_GUILD_ID`, it is registered in that server; without it, registration is global and may take time to appear. `dev` starts the bot. In the installed server, try:

```text
/imagine prompt: a tiny astronaut tending a greenhouse on the moon, warm storybook illustration
```

The bot replies with the submitted prompt and an embed containing the generated image. For a production build, the package scripts are `npm run build` followed by `npm run start`.

## Code tour

- [`src/register.ts`](src/register.ts) defines and registers `/imagine`.
- [`src/bot.ts`](src/bot.ts) handles the interaction, defers the Discord reply while generation runs, and sends the returned image URL.
- [`src/config.ts`](src/config.ts) loads `.env.local` and reads the Discord and Comfy settings.
- [`src/comfy.ts`](src/comfy.ts) creates the Comfy SDK client, loads the workflow, binds the prompt with `workflow.setInput(config.promptNodeId, config.promptInput, prompt)`, submits the job, and returns the image download URL.
- [`workflows/workflow_api.json`](workflows/workflow_api.json) is the API-format workflow. Its prompt is node `30:19`, input `value`; its output is the `SaveImage` node. [`workflows/README.md`](workflows/README.md) explains the binding and how to swap workflows.

## Deploy to Render

Use the button above to create the configured Render **Background Worker** from the repository. The root [`render.yaml`](../render.yaml) sets the bot directory, build and start commands, registers the slash command on initial deploy, and prompts for `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, and `COMFY_API_KEY`. It also supplies the bundled workflow's prompt binding and Comfy Cloud endpoint. Add `DISCORD_GUILD_ID` in Render only if you want guild-scoped registration.

## API key and Comfy credits

`COMFY_API_KEY` is read by the worker and stays server-side; never put it in a Discord message or client-side code. Each `/imagine` request submits a Comfy generation and uses credits from the Comfy account associated with that key. `DISCORD_TOKEN` is a separate secret used to connect the bot to Discord.
