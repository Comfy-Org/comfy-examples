# Canvas to Image

Draw or import a rough guide, describe the finished image, and render with Qwen image generation guided by ControlNet.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fsketch-to-image&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.)

## Run locally

Requires Node.js 22 or newer and a Comfy API key.

```bash
cp .env.example .env.local
# Set COMFY_API_KEY in .env.local
npm ci
npm run dev
```

Open the local URL printed by Next.js. `.env.example` also documents the optional `COMFY_BASE_URL` override for a Comfy deployment or compatible proxy; otherwise the SDK uses Comfy Cloud.

## Try it

Draw a simple scene or import a guide, enter a prompt, then use **Render image** (or enable **Live preview**). Adjust **Structure** to change how closely the result follows the guide; download the finished image from the result panel.

## Code tour

- [components/sketch-studio.tsx](components/sketch-studio.tsx) draws or imports the guide and sends its PNG, prompt, and structure value to `POST /api/jobs`; it polls `GET /api/jobs/[id]` for results.
- [app/api/jobs/route.ts](app/api/jobs/route.ts) validates the canvas and adds prompt hints from the selected sketch colors. [app/api/jobs/[id]/route.ts](app/api/jobs/%5Bid%5D/route.ts) returns job status.
- [lib/comfy.ts](lib/comfy.ts) uploads the PNG as an SDK asset and binds `121.image`, `86:81.text`, `86:129.strength`, and a random value to `86:3.seed`.
- [workflows/workflow_api.json](workflows/workflow_api.json) is the exported Qwen/ControlNet graph behind those bindings.

`COMFY_API_KEY` stays on the server. Each render uses credits from the configured Comfy account; live preview can submit additional renders as you edit.
