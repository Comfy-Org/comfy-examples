# The Record — historical figures chat

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fhistorical-figures-chat&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.&project-name=comfy-historical-figures-chat&repository-name=comfy-historical-figures-chat)

Choose a historical figure, ask a question, and receive a short video response
rendered by the bundled Comfy Cloud workflow.

Requires Node.js 22.6+ and a
[Comfy API key](https://platform.comfy.org/profile/api-keys).

## Deploy

Click **Deploy with Vercel** and enter a `COMFY_API_KEY` from
[Comfy API Keys](https://platform.comfy.org/profile/api-keys). For Comfy Cloud,
that is the only setup required.

The deployed app is public and generations consume the key owner's Comfy
credits. Keep it limited to a trusted audience unless you add access controls.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Add the API key to `.env.local`:

```dotenv
COMFY_API_KEY=comfyui-...
```

The API key stays on the server.

## Run on Developer Platform

Use a Developer Platform deployment when a replacement workflow needs custom
nodes or models. First install and test those dependencies in local ComfyUI,
export the workflow to `workflows/workflow_api.json`, then run from that ComfyUI
directory:

```bash
comfy cloud login
comfy build init --name historical-figures-chat
comfy build push --release --target linux/nvidia
comfy deploy up --watch
comfy deploy ls
```

Set `COMFY_BASE_URL` to the deployment's `https://dep-...run.comfy.app`
endpoint. Keep the same `COMFY_API_KEY`, and update the input bindings in
[lib/comfy.ts](lib/comfy.ts) when node IDs change.
