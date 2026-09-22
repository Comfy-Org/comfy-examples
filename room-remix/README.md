# Room Remix

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Froom-remix&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.)

Pick a room, choose a mood, and move furniture around before asking Comfy Cloud
to make the redesign photorealistic. The palettes range from **Moss arcade** to
**Disco fruit**; the oddities shelf has a mushroom stool, disco ball, and
snail-shaped planter, because apparently the room needed a snail.

## Run locally

Requires Node.js 22.6.0 or newer and a [Comfy API key](https://platform.comfy.org/profile/api-keys).

```bash
cp .env.example .env.local
# Replace the placeholder with your Comfy API key
npm install
npm run dev
```

Set `COMFY_API_KEY` in `.env.local` as shown in `.env.example`. Open the local
address printed by Next.js, choose **Sunny living room**, select **Space motel**,
add a disco ball, and press **Remix**. When the render finishes, the redesigned
room appears in the preview. **Save** stores the current idea in this browser's
local storage; it does not create an account or cloud gallery.

## Code tour

- [`components/room-remix.tsx`](components/room-remix.tsx) handles room and style selection, furniture placement, image upload, saving a local draft, and Comfy job polling.
- [`app/api/jobs/route.ts`](app/api/jobs/route.ts) validates the image, style, and placed furniture; [`app/api/jobs/[id]/route.ts`](app/api/jobs/%5Bid%5D/route.ts) fetches job status.
- [`lib/room-design.ts`](lib/room-design.ts) maps each style and furniture item into a prompt, including approximate left/center/right and foreground/back placement.
- [`lib/comfy.ts`](lib/comfy.ts) binds the uploaded room to the `LoadImage` node, builds a prompt from the selected palette and furniture, and randomizes the sampler seed.
- [`workflows/workflow_open_api.json`](workflows/workflow_open_api.json) is the open-weight Qwen Image Edit 2511 graph used by Comfy Cloud. The app changes its image, positive prompt, and sampler seed.

The Comfy API key stays on the server. Each room makeover sends the selected
photo to Comfy Cloud and uses the key owner's generation credits.
