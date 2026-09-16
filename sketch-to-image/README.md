# Canvas to Image

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fsketch-to-image&env=COMFY_BASE_URL%2CCOMFY_API_KEY&envDescription=Enter+the+Comfy+Serverless+endpoint+and+your+Comfy+API+key.)

Draw or import a guide, describe the result, and generate an image.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Add `COMFY_API_KEY` to `.env.local`. The example uses Comfy Cloud by default.

## Workflow

The Qwen ControlNet workflow binds:

```text
guide image → LoadImage (121.image)
prompt      → CLIPTextEncode (86:81.text)
structure   → ControlNetApplyAdvanced (86:129.strength)
```

To swap the workflow, replace `workflows/workflow_api.json` and update its
bindings in [lib/comfy.ts](lib/comfy.ts).
