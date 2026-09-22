# Bureau of Visual Corrections

Mark an unwanted object in a photo and let Comfy's Flux Erase workflow reconstruct the area behind it.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fobject-removal&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.)

## Run locally

Requires Node.js 22.6 or newer and a Comfy API key.

```bash
cp .env.example .env.local
# Set COMFY_API_KEY in .env.local
npm ci
npm run dev
```

Open the local URL printed by Next.js. `.env.example` contains the required key; the SDK uses Comfy Cloud by default.

## Try it

Select **Load demonstration photo**, brush over an object, and adjust the edge expansion if needed. Submit the correction and wait for the reconstructed image.

## Code tour

- [components/removal-studio.tsx](components/removal-studio.tsx) exports the brush strokes as a transparent PNG mask and posts the source image, mask, and edge setting to `POST /api/jobs`; it polls `GET /api/jobs/[id]`.
- [app/api/jobs/route.ts](app/api/jobs/route.ts) validates the photo, mask, and edge value. [app/api/jobs/[id]/route.ts](app/api/jobs/%5Bid%5D/route.ts) returns job status.
- [lib/comfy.ts](lib/comfy.ts) uploads the two images as SDK assets. It binds them to `1.image` and `2.image`, then binds edge expansion and a random seed to `3.dilate_pixels` and `3.seed`.
- [workflows/workflow_api.json](workflows/workflow_api.json) connects node 1 to the Flux Erase image input and node 2's alpha output (`["2", 1]`) to its mask input; node 4 saves the corrected image.

`COMFY_API_KEY` stays on the server. Each submitted removal uses credits from the configured Comfy account.
