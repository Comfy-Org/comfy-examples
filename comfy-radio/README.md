# Comfy Radio

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fcomfy-radio&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.)

Tune a little wooden radio to one of five fictional stations, then ask it for a
track to match the moment. Lofi Workdesk, Late Night Synthwave, Cinematic Score,
Ambient Drift, and Comfy AM each bring their own sound; turning the dial is
free, but pressing **Power on & generate** makes the music.

## Run locally

Requires Node.js 22.6.0 or newer and a [Comfy API key](https://platform.comfy.org/profile/api-keys).

```bash
cp .env.example .env.local
# Put your key after the equals sign in .env.local
npm install
npm run dev
```

Set `COMFY_API_KEY` in `.env.local`; `.env.example` names the variable. Open
the local address printed by Next.js, select **Late Night Synthwave**, enter
“rain-slick boulevard after closing time,” and press **Power on & generate**.
The radio returns a playable one-minute track.

## Code tour

- [`components/radio-console.tsx`](components/radio-console.tsx) draws the cabinet and tuner, collects the station and listener's variation, and plays the returned audio.
- [`app/api/jobs/route.ts`](app/api/jobs/route.ts) validates the station and prompt; [`app/api/jobs/[id]/route.ts`](app/api/jobs/%5Bid%5D/route.ts) polls the Comfy job.
- [`lib/stations.ts`](lib/stations.ts) gives each frequency its own musical direction and example prompts.
- [`lib/comfy.ts`](lib/comfy.ts) loads [`workflows/workflow_api.json`](workflows/workflow_api.json), combines the selected station and listener prompt at `94.tags`, sets a one-minute instrumental at both duration inputs, and randomizes `3.seed`.
- [`workflows/ace-step-reference.json`](workflows/ace-step-reference.json) is the readable Comfy Cloud gallery workflow behind the API-format graph. It uses the open ACE-Step 1.5 workflow and contains no partner nodes.

The Comfy key is used only on the server. Each generated track consumes the
key owner's Comfy Cloud credits; the audio URL returned by Comfy is temporary.
