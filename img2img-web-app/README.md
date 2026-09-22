# Image upscaler

Upload a PNG, JPEG, or WebP image and make a 4× larger copy with Comfy's image scaling workflow.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fimg2img-web-app&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.)

## Run locally

Requires Node.js 22.6 or newer and a Comfy API key.

```bash
cp .env.example .env.local
# Set COMFY_API_KEY in .env.local
npm ci
npm run dev
```

Open the local URL printed by Next.js. `.env.example` also documents the optional `COMFY_BASE_URL` override for a Comfy deployment or compatible proxy; otherwise the SDK uses Comfy Cloud.

## Try it

Choose an image under 10 MB, select **Upscale image**, and wait for the result to appear. Use **Download result** to save it.

## Code tour

- [components/app-runner.tsx](components/app-runner.tsx) uploads the selected file to `POST /api/jobs` and polls `GET /api/jobs/[id]`.
- [app/api/jobs/route.ts](app/api/jobs/route.ts) validates the upload; [app/api/jobs/[id]/route.ts](app/api/jobs/%5Bid%5D/route.ts) returns job status.
- [lib/app-template.ts](lib/app-template.ts) binds the upload to node `1.image`; [lib/comfy.ts](lib/comfy.ts) loads the workflow, uploads the file as an SDK asset, submits the job, and serializes outputs.
- [workflows/workflow_api.json](workflows/workflow_api.json) scales node 1 through `ImageScaleBy` node 2 at `scale_by: 4`, then saves with `SaveImage` node 6.

`COMFY_API_KEY` stays on the server. Each submitted upscale uses credits from the configured Comfy account.
