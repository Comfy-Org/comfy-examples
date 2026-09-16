# Img2img web app

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fimg2img-web-app&env=COMFY_BASE_URL%2CCOMFY_API_KEY&envDefaults=%7B%22COMFY_BASE_URL%22%3A%22https%3A%2F%2Fcloud.comfy.org%22%7D&envDescription=Comfy%20Cloud%20is%20pre-filled.%20Replace%20it%20with%20your%20Comfy%20Serverless%20deployment%20URL%20if%20needed%2C%20then%20enter%20your%20Comfy%20API%20key.)

Upload an image and receive a 4× upscaled result.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Add your Comfy endpoint and API key to `.env.local`:

```bash
COMFY_BASE_URL=https://your-deployment.run.comfy.app
COMFY_API_KEY=comfyui-...
```

Use `https://cloud.comfy.org` for Comfy Cloud. To target another compatible
deployment, set its URL as `COMFY_BASE_URL`.

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
