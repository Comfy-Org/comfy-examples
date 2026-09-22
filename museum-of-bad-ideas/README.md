# Museum of Bad Ideas

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fmuseum-of-bad-ideas&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.)

Give a questionable doodle six departments' worth of undeserved prestige:
luxury poster, children's book, ancient artifact, video-game boss, fashion
editorial, or cinematic concept frame. The original's awkward silhouette is
supposed to survive the promotion. Every new exhibit gets its own deadpan label.

## Run locally

Requires Node.js 22 or newer and a [Comfy API key](https://platform.comfy.org/profile/api-keys).

```bash
cp .env.example .env.local
# Put your key after the equals sign in .env.local
npm install
npm run dev
```

Set `COMFY_API_KEY` in `.env.local`; `.env.example` contains the variable name.
Open the local address printed by Next.js, upload a PNG, JPEG, or WebP doodle
under 10 MB, choose **Ancient artifact**, and send it to the curators. Expect a
stone creature with the same suspiciously lumpy outline and a museum plaque.

## Code tour

- [`components/museum-studio.tsx`](components/museum-studio.tsx) pairs the uploaded doodle with the generated exhibit and handles job polling.
- [`app/api/jobs/route.ts`](app/api/jobs/route.ts) validates the upload and accepts an exhibit ID; [`app/api/jobs/[id]/route.ts`](app/api/jobs/%5Bid%5D/route.ts) returns its Comfy job status.
- [`lib/exhibits.ts`](lib/exhibits.ts) defines each department's voice, plaque details, and image prompt. The browser sends a preset ID, not arbitrary prompt text.
- [`lib/comfy.ts`](lib/comfy.ts) loads [`workflows/workflow_api.json`](workflows/workflow_api.json), binds the doodle to `121.image`, curator prompt to `86:81.text`, and the randomized seed to `86:3.seed`; the exhibit's structural strength is set at `86:129.strength`. The graph saves its result through `60.images`.

The Comfy key stays on the server. Every exhibit submission uses the key
owner's Comfy Cloud credits.
