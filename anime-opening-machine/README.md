# Frame / Fable — Anime Opening Machine

Give one character a theme and Frame / Fable turns it into an eight-frame anime opening. Choose two to four frames to animate into short shots, then assemble the shots into a looping MP4.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fanime-opening-machine&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.&project-name=comfy-anime-opening-machine&repository-name=comfy-anime-opening-machine)

## Run locally

Requires Node.js `>=22.6.0` and a Comfy API key.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Put your key in `.env.local` as `COMFY_API_KEY`. Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The key stays on the server; each Comfy Cloud generation uses the account's credits.

## Try it

Upload a protagonist, optionally add a rival, and enter a theme such as “a courier races across a starlit city to stop its moon from falling.” Generate the storyboard, select two to four finished frames, animate them, and assemble the completed shots into a loop.

## Code tour

- [components/opening-machine.tsx](components/opening-machine.tsx) sends the character images and theme to `POST /api/storyboards`, then selected frame indexes to `POST /api/animations`.
- [app/api/storyboards/route.ts](app/api/storyboards/route.ts), [app/api/animations/route.ts](app/api/animations/route.ts), and [app/api/assemble/route.ts](app/api/assemble/route.ts) validate and start the three stages.
- [lib/comfy.ts](lib/comfy.ts) loads each API workflow and binds the character images to Load Image nodes `173` and `174`, the frame prompt to Qwen node `107`, the first frame to MiniMax H3 node `105:104`, and selected clips to assembly slots `1`–`4`.
- [lib/story.ts](lib/story.ts) writes a frame-specific prompt; the workflow graphs are [storyboard_open_api.json](workflows/storyboard_open_api.json), [animation_open_api.json](workflows/animation_open_api.json), and [assemble_api.json](workflows/assemble_api.json). These graphs use open-weight Comfy nodes and do not forward a partner API key.

## Workflow notes

Eight separate image jobs give each storyboard frame its own prompt and seed. Qwen Image Edit 2511 makes the storyboard frames; MiniMax H3 turns selected images into short video shots. Both are open-weight Comfy Cloud workflows. The assembly graph has four clip slots, so shorter selections repeat in order to fill the loop.
