# The Record — historical figures chat

Choose a historical figure, ask a question, and receive a short video response shaped by a curated persona brief. It is a creative reconstruction, not a primary source or an attributed performance.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fhistorical-figures-chat&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.&project-name=comfy-historical-figures-chat&repository-name=comfy-historical-figures-chat)

## Run locally

Requires Node.js `>=22.6.0` and a Comfy API key.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `COMFY_API_KEY` in `.env.local`, then open [http://127.0.0.1:3000](http://127.0.0.1:3000). `COMFY_BASE_URL` is optional and only needed when using a Developer Platform deployment instead of Comfy Cloud. The API key stays on the server; generated replies use the key owner's Comfy credits.

## Try it

Choose Ada Lovelace and ask, “What do you imagine a machine might create beyond numbers?” The app sends the question history and Ada's persona to Comfy, then shows the returned response video. Replies are brief interpretations; check reliable historical sources for facts and quotations.

## Code tour

- [components/historical-chat.tsx](components/historical-chat.tsx) sends the selected `figureId` and user messages to `POST /api/chat`, then polls `GET /api/jobs/[id]` for the video.
- [app/api/chat/route.ts](app/api/chat/route.ts) validates the request and resolves the figure through [lib/figures.ts](lib/figures.ts), where each persona and portrait is defined.
- [lib/comfy.ts](lib/comfy.ts) loads [workflows/workflow_api.json](workflows/workflow_api.json), uploads the figure portrait, and binds image node `114` plus `system_prompt` and `user_prompt` on node `2585308530609103`. The graph's `SaveVideo` node `92` produces the response clip.

## Workflow notes

The portrait asset is bundled locally for six figures; two portraits are fetched from Wikimedia at request time. The workflow combines a concise text reply with a generated video. If node IDs change in the API export, update the corresponding `setInput` bindings in `lib/comfy.ts`.
