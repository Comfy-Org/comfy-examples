# Forma — Profile Picture Studio

Bring a portrait to picture day at the edge of the solar system. Pick one of five styles and get eight profile-picture variations to browse, or regenerate a single portrait you like.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fprofile-picture-generator&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.&project-name=comfy-profile-picture-generator&repository-name=comfy-profile-picture-generator)

## Run locally

Requires Node.js `>=22.6.0` and a Comfy API key.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `COMFY_API_KEY` in `.env.local`, then open [http://127.0.0.1:3000](http://127.0.0.1:3000). `COMFY_BASE_URL` is optional for a Developer Platform deployment. The key remains server-side; portrait generations use the key owner's Comfy credits.

## Try it

Upload a portrait, choose **Space Cowboy**, and make a bundle. Browse the eight variations, favorite one, or download it. Use single regeneration when you want another take in the same style.

## Code tour

- [components/profile-picture-studio.tsx](components/profile-picture-studio.tsx) posts the portrait, style ID, and `bundle` or `single` mode to `POST /api/bundles`; [components/bundle-grid.tsx](components/bundle-grid.tsx) displays and downloads the returned images.
- [app/api/bundles/route.ts](app/api/bundles/route.ts) validates the upload and style. [lib/styles.ts](lib/styles.ts) owns the five curated prompts; the browser sends style IDs rather than arbitrary prompts.
- [lib/comfy.ts](lib/comfy.ts) loads the open-weight graphs imported from [profile-picture-bundle.compiled.json](blueprints/profile-picture-bundle.compiled.json) and [profile-picture-single.compiled.json](blueprints/profile-picture-single.compiled.json). It binds the uploaded portrait, sets each positive Qwen image-edit prompt, and randomizes each sampler seed. The editable compositions are [profile-picture-bundle.yaml](blueprints/profile-picture-bundle.yaml) and [profile-picture-single.yaml](blueprints/profile-picture-single.yaml).

## Workflow notes

The bundle graph has eight parallel image-edit branches; the single graph has one. Both use the same uploaded portrait and style-specific prompt builder. After editing a blueprint, run `npm run build:workflows` to compose the API graphs; this requires the Comfy CLI to be installed and configured. `assets/sample-person.png` is only a workflow-authoring fixture—live requests use the visitor's upload.
