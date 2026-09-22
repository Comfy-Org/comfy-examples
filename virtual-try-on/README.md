# Thread & Form — Virtual Try-On

Pair a person photo with a garment photo and ask Comfy Cloud's open-weight Qwen Image Edit workflow to dress the person in the garment.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fvirtual-try-on&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.)

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

The studio loads a sample person and garment when it opens. Choose a garment category and click **Generate try-on** to submit a real job; use **Before / After** to compare and download the result. You can replace either sample with your own PNG, JPEG, or WebP image under 10 MB.

## Code tour

- [components/try-on-studio.tsx](components/try-on-studio.tsx) loads the bundled sample pair, accepts replacements, and posts `person`, `garment`, and `garmentType` to `POST /api/jobs`; it polls `GET /api/jobs/[id]`.
- [app/api/jobs/route.ts](app/api/jobs/route.ts) validates both uploads. [app/api/jobs/[id]/route.ts](app/api/jobs/%5Bid%5D/route.ts) returns job status.
- [lib/comfy.ts](lib/comfy.ts) uploads both photos as SDK assets and binds them to the person and garment image inputs. It turns the selected category into an edit prompt and randomizes the sampler seed.
- [workflows/workflow_open_api.json](workflows/workflow_open_api.json) is a small Qwen Image Edit graph: image inputs `173` and `174`, prompt node `107`, sampler `121`, and saved result `124`.

`COMFY_API_KEY` stays on the server. The workflow uses Comfy Cloud and the configured account's generation credits. The sample result shown before generation is a bundled image and does not submit a job.
