# Canvas to Image

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fsketch-to-image&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.)

Draw or import a guide, describe the result, and generate an image.

Requires Node.js 22+ and a
[Comfy API key](https://platform.comfy.org/profile/api-keys).

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

## Run on Developer Platform

Use a Developer Platform deployment when the replacement workflow needs custom
nodes or models. First install and test those dependencies in local ComfyUI,
then run from that ComfyUI directory:

```bash
comfy cloud login
comfy build init --name sketch-to-image
comfy build push --release --target linux/nvidia
comfy deploy up --watch
comfy deploy ls
```

Set `COMFY_BASE_URL` to the deployment's `https://dep-...run.comfy.app`
endpoint. Keep the same `COMFY_API_KEY`.
