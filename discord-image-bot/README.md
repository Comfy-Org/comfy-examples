# Comfy Discord image bot

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples)

A minimal Discord `/imagine` bot backed by a replaceable Comfy text-to-image
workflow.

```text
/imagine prompt
→ Discord bot
→ Comfy SDK submits workflow_api.json
→ bot replies with the generated image URL
```

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

Add the Application ID and bot token from the previous section to `.env.local`.
For development, set `DISCORD_GUILD_ID` to your test server's ID; this registers
`/imagine` in that server immediately. Omit it to register the command globally.

When the bot prints `Ready as …`, run `/imagine` in the server where you
installed it.

## Deploy to Render

The button above creates a Render **Background Worker**. It defaults to Comfy
Cloud and prompts for the Discord and Comfy API secrets, registers `/imagine`,
then starts the bot. No Render integration or account setup is needed by the
repository author; each deployer signs in with their own Render account.

Because this repository is private, deployers must also grant Render's GitHub
App access to it before using the button.

The Blueprint uses the bundled workflow's prompt defaults. To use a different
workflow, replace `workflow_api.json`, then update `COMFY_PROMPT_NODE_ID` and
`COMFY_PROMPT_INPUT` in the Render service's environment settings before
redeploying.

## Comfy workflow

The bundled `workflows/workflow_api.json` is an API-format text-to-image
example. `COMFY_BASE_URL` defaults to Comfy Cloud. Replace it with a
Developer Platform Serverless URL when your workflow needs a custom deployment.

### Use custom nodes or models

Create the serverless runtime from a local, tested ComfyUI environment:

```bash
comfy cloud login
comfy build scan -o build.json
comfy build create --from build.json --name discord-image-bot --execute
```

The scan runs locally; the `--execute` step creates the build on the Developer
Platform, but not the endpoint. Open
[Developer Platform Deployments](https://platform.comfy.org/profile/deployments),
create a **Deployment** from the resulting build version, then set Render's
`COMFY_BASE_URL` to its `https://dep-...run.comfy.app` URL. Custom nodes only
need to be present in the scanned environment; they do not need to be publicly
published.

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

To use a different workflow later, replace `workflow_api.json` with an API
export and update `COMFY_PROMPT_NODE_ID` / `COMFY_PROMPT_INPUT`.
