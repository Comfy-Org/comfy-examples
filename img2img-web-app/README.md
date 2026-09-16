# Img2img web app

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fimg2img-web-app&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.)

Upload an image and receive a 4× upscaled result.

Requires Node.js 22.6+ and a
[Comfy API key](https://platform.comfy.org/profile/api-keys).

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Add your API key to `.env.local`:

```bash
COMFY_API_KEY=comfyui-...
```

## Replace the workflow

1. Build and test a workflow in ComfyUI.
2. Export it with **File → Export Workflow (API)**.
3. Replace [workflows/workflow_api.json](workflows/workflow_api.json).
4. Update the input binding in [lib/app-template.ts](lib/app-template.ts):

```ts
image: { nodeId: "1", input: "image" }
```

Use the node ID and input name from your export, and keep a terminal output node
such as `SaveImage`, `SaveVideo`, or `SaveAudio`.

## Run on Developer Platform

Use a Developer Platform deployment when the replacement workflow needs custom
nodes or models. First install and test those dependencies in local ComfyUI,
then run from that ComfyUI directory:

```bash
comfy cloud login
comfy build init --name img2img-web-app
comfy build push --release --target linux/nvidia
comfy deploy up --watch
comfy deploy ls
```

Set `COMFY_BASE_URL` to the deployment's `https://dep-...run.comfy.app`
endpoint. Keep the same `COMFY_API_KEY`.
