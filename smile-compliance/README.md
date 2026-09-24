# People & Culture: Mandatory Morale

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fsmile-compliance&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.)

People Ops has flagged your image for insufficient enthusiasm. Upload a person,
pet, object, or glum piece of produce; then choose how much mandatory joy to
apply, from “Barely compliant” to “Aggressively delighted.” The result is an
image edit, not a performance review. (The performance review is next quarter.)

## Run locally

Requires Node.js 22.6.0 or newer and a [Comfy API key](https://platform.comfy.org/profile/api-keys).

```bash
cp .env.example .env.local
# Put your key after the equals sign in .env.local
npm install
npm run dev
```

Set `COMFY_API_KEY` in `.env.local`; `.env.example` shows its name and expected
format. Open the local address printed by Next.js. Upload a PNG, JPEG, or WebP
under 10 MB, choose an enthusiasm level, and press **Submit for cheer review**.
The app returns the edited image when Comfy Cloud finishes.

## Code tour

- [`components/smile-station.tsx`](components/smile-station.tsx) handles the upload, before/after view, enthusiasm selector, and job polling.
- [`app/api/jobs/route.ts`](app/api/jobs/route.ts) checks the image and selected level before submission; [`app/api/jobs/[id]/route.ts`](app/api/jobs/%5Bid%5D/route.ts) fetches job status.
- [`lib/smile.ts`](lib/smile.ts) owns the three HR-approved levels and combines each level with the identity-preserving edit instructions.
- [`lib/comfy.ts`](lib/comfy.ts) uploads the image as an SDK asset, adds the selected morale prompt, and randomizes the sampler seed.
- [`workflows/workflow_open_api.json`](workflows/workflow_open_api.json) is the open-weight Qwen Image Edit 2511 graph used by Comfy Cloud; the app changes only its image, positive prompt, and seed.

The Comfy key is read on the server and never sent to the browser. Each submitted
edit uses the key owner's Comfy Cloud credits.
