# The Impossible Food Network

Turn a photo of a meal into a surreal food-ad concept, then give the finished hero image a six-second commercial. Every spot starts with your actual dish; the concept supplies the deliciously implausible direction.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fimpossible-food-network&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.&project-name=impossible-food-network&repository-name=impossible-food-network)

## Run locally

Requires Node.js `>=22.6.0` and a Comfy API key.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `COMFY_API_KEY` in `.env.local`, then open [http://127.0.0.1:3000](http://127.0.0.1:3000). The key stays on the server. Comfy Cloud receives the uploaded image when you start a render, and image and video stages spend the account's credits.

## Try it

Upload a ramen photo, choose **Molten ramen volcano**, and select an aspect ratio. The first pass returns a transformed still; when it is ready, start the video pass to get a six-second commercial. Preview or download either result.

## Code tour

- [components/food-network-studio.tsx](components/food-network-studio.tsx) submits the image and preset to `POST /api/jobs`, polls the job route, then starts the video stage at `/api/jobs/[id]/video`.
- [app/api/jobs/route.ts](app/api/jobs/route.ts) validates the upload and preset; [lib/food-presets.ts](lib/food-presets.ts) keeps each spot's image and motion direction together.
- [lib/comfy.ts](lib/comfy.ts) binds the upload to node `32` and the preset image prompt to `45:36` in [food-edit_api.json](workflows/food-edit_api.json). For the video pass it binds the still to node `395`, motion prompt to `398:376`, duration to `398:362`, and aspect ratio to `403` in [food-video_api.json](workflows/food-video_api.json).

## Workflow notes

The app runs two Comfy Cloud graphs in sequence: Boogu edits the meal into a hero still; LTX-2.5 animates that still at 24 fps. The API-format JSON files are the graphs the server loads. Their editable gallery references are `workflows/image-edit-reference.json` and `workflows/video-reference.json`; validate and rebuild exports before changing node bindings.
