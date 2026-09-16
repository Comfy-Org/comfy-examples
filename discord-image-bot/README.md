# Comfy Discord image bot

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples)

A Discord `/imagine` bot backed by a Comfy text-to-image workflow.

Requires Node.js 22+, a
[Comfy API key](https://platform.comfy.org/profile/api-keys), and a Discord
application.

## Create a Discord app

1. Open the [Discord Developer Portal](https://discord.com/developers/applications)
   and select **New Application**.
2. On **General Information**, copy the **Application ID** into
   `DISCORD_APPLICATION_ID`.
3. On **Bot**, use **Reset Token** to create a token and copy it into
   `DISCORD_TOKEN`. Discord only shows this token once—keep it out of Git and
   do not share it.
4. On **Installation**, leave **Guild Install** enabled (it is normally on by
   default). Under Default Install Settings, select `applications.commands`
   and `bot`, then allow the following minimum bot permissions:

   - **Send Messages**
   - **Embed Links**

   Copy the generated install link and use it to add the bot to a test server.

## Configure and run

```bash
cp .env.example .env.local
npm install
npm run register
npm run dev
```

Set `DISCORD_APPLICATION_ID`, `DISCORD_TOKEN`, and `COMFY_API_KEY` in
`.env.local`. For development, set `DISCORD_GUILD_ID` to your test server's ID;
omit it to register `/imagine` globally.

When the bot prints `Ready as …`, run `/imagine` in the server where you
installed it.

## Deploy to Render

The button creates a Render **Background Worker** and prompts for the Discord
and Comfy credentials.

## Workflow

```text
User prompt input: 30:19.value
Output: SaveImage
```

### Prompt expansion

The default prompt binding uses expansion. To bypass it, set:

```text
COMFY_PROMPT_NODE_ID=30:6
COMFY_PROMPT_INPUT=text
```

To use another workflow, replace `workflows/workflow_api.json` with an API
export and update `COMFY_PROMPT_NODE_ID` and `COMFY_PROMPT_INPUT`.

## Run on Developer Platform

Use a Developer Platform deployment when the replacement workflow needs custom
nodes or models. First install and test those dependencies in local ComfyUI,
then run from that ComfyUI directory:

```bash
comfy cloud login
comfy build init --name discord-image-bot
comfy build push --release --target linux/nvidia
comfy deploy up --watch
comfy deploy ls
```

Set `COMFY_BASE_URL` in Render or `.env.local` to the deployment's
`https://dep-...run.comfy.app` endpoint. Keep the same `COMFY_API_KEY`.
