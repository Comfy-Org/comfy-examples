# Comfy API app template

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fimage-upscaler&env=COMFY_BASE_URL%2CCOMFY_API_KEY&envDefaults=%7B%22COMFY_BASE_URL%22%3A%22https%3A%2F%2Fcloud.comfy.org%22%7D&envDescription=Comfy%20Cloud%20is%20pre-filled.%20Replace%20it%20with%20your%20Comfy%20Serverless%20deployment%20URL%20if%20needed%2C%20then%20enter%20your%20Comfy%20API%20key.)

One private Comfy workflow becomes one simple app: upload an image, submit a
job, poll it, and display the result.

```text
browser image → Comfy SDK asset → workflow_api.json → job → output URL
```

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set these in `.env.local`:

```bash
COMFY_BASE_URL=https://your-deployment.run.comfy.app
COMFY_API_KEY=comfyui-...
```

For a local `comfy-api-proxy`, use `http://127.0.0.1:8189`; an API key is
optional unless the proxy is configured with one.

## Comfy Developer Platform

This template does not create GPU infrastructure. It connects to an existing
Comfy Developer Platform deployment:

```text
Build (models + custom nodes) → Release → Serverless deployment → this app
```

Create or select a deployment in the [Comfy Developer Platform](https://platform.comfy.org), then copy its `https://<deployment>.run.comfy.app` URL into `COMFY_BASE_URL`. The app sends `workflow_api.json` to that endpoint with the Comfy SDK. The deployment must contain the models and nodes used by the workflow. See the [Comfy Serverless guide](https://docs.comfy.org/development/serverless/overview) and [SDK guide](https://docs.comfy.org/development/api-development/sdks).

## API integration

The server-side integration in [lib/comfy.ts](lib/comfy.ts) follows the Comfy
SDK pattern:

```ts
const wf = await client.workflows.fromFile("workflow_api.json");
const asset = client.assets.fromBytes(bytes, { filename, contentType });
wf.setInput("1", "image", asset);
const job = await client.submit(wf);
```

The browser never receives the Comfy key or the workflow graph.

## Replace the workflow

1. Build and test a workflow in ComfyUI.
2. Export it with **File → Export Workflow (API)**.
3. Replace [workflows/workflow_api.json](workflows/workflow_api.json).
4. Update the input binding in [lib/app-template.ts](lib/app-template.ts):

```ts
image: { nodeId: "1", input: "image" }
```

Use the node ID and input name from your exported workflow. Keep a terminal
output node such as `SaveImage`, `SaveVideo`, or `SaveAudio` so Comfy returns a
result. The configured Comfy deployment must include every model and custom
node required by the replacement workflow.

## Deploy the app with Vercel

Vercel pre-fills `COMFY_BASE_URL` with `https://cloud.comfy.org`. You can keep
that value or replace it in the deploy form with your
`https://<deployment>.run.comfy.app` Serverless URL. It still prompts for
`COMFY_API_KEY`, which must be entered privately and stored in Vercel, never
Git. Future Git pushes deploy automatically. See Vercel’s [Deploy Button](https://vercel.com/docs/deploy-button) and [environment-variable guidance](https://vercel.com/docs/deploy-button/environment-variables).

## Verify

```bash
npm test
npm run build
```
