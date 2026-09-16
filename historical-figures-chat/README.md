# The Record — historical figures chat

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fhistorical-figures-chat&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.&project-name=comfy-historical-figures-chat&repository-name=comfy-historical-figures-chat)

Choose a historical figure, ask a question, and receive a short video response
rendered by the bundled Comfy Cloud workflow.

## Deploy

Click **Deploy with Vercel** and enter a `COMFY_API_KEY` from
[Comfy API Keys](https://platform.comfy.org/profile/api-keys). That is the only
Comfy setup required.

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
