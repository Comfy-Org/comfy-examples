# Canvas to Image

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fsketch-to-image&env=COMFY_BASE_URL%2CCOMFY_API_KEY&envDescription=Enter+the+Comfy+Serverless+endpoint+and+your+Comfy+API+key.)

A minimal Comfy sample for sketch-guided generation.

```text
sketch + prompt → workflow → image
```

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `COMFY_API_KEY` in `.env.local`. The default `COMFY_BASE_URL` is Comfy
Cloud; replace it with a Developer Platform Serverless deployment URL when the
workflow is installed there.

## Use custom nodes or models

For a workflow that needs custom nodes or non-default models, prepare a local
ComfyUI environment with those dependencies installed and tested, then run:

```bash
comfy cloud login
comfy build scan -o build.json
comfy build create --from build.json --name sketch-to-image --execute
```

The scan is local. The `--execute` step creates the serverless build on the
Developer Platform, but the CLI does not create the endpoint. Open
[Developer Platform Deployments](https://platform.comfy.org/profile/deployments),
create a **Deployment** from that build version, then set `COMFY_BASE_URL` to
the resulting `https://dep-...run.comfy.app` URL. The custom nodes do not need
a public Registry release.

## Use it

Draw or import a guide, describe the result, and render. Changes to the sketch
or prompt replace the image on the right.

## Workflow

The Qwen ControlNet workflow binds:

```text
guide image → LoadImage (121.image)
prompt      → CLIPTextEncode (86:81.text)
structure   → ControlNetApplyAdvanced (86:129.strength)
```

To swap the workflow, replace `workflows/workflow_api.json` and update its
bindings in [lib/comfy.ts](lib/comfy.ts).
