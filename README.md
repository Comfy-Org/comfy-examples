# Comfy examples

Standalone applications built with the Comfy API.

## Examples

| Example | What it does | Deploy |
| --- | --- | --- |
| [img2img-web-app](img2img-web-app) | Upload an image and run a Comfy image workflow. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fimg2img-web-app&env=COMFY_BASE_URL%2CCOMFY_API_KEY&envDefaults=%7B%22COMFY_BASE_URL%22%3A%22https%3A%2F%2Fcloud.comfy.org%22%7D&envDescription=Enter+the+Comfy+Serverless+endpoint+and+your+Comfy+API+key.) |
| [sketch-to-image](sketch-to-image) | Draw a guide and generate a matching image. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fsketch-to-image&env=COMFY_BASE_URL%2CCOMFY_API_KEY&envDescription=Enter+the+Comfy+Serverless+endpoint+and+your+Comfy+API+key.) |
| [discord-image-bot](discord-image-bot) | Run a Discord `/imagine` bot backed by a Comfy workflow. | [Deploy to Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples) |
| [historical-figures-chat](historical-figures-chat) | Chat with a historical figure and receive a ComfyUI-rendered video response. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fhistorical-figures-chat&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.&project-name=comfy-historical-figures-chat&repository-name=comfy-historical-figures-chat) |

Deployments are public and use your Comfy credits. Protect them before sharing.

## Local development

```bash
cd sketch-to-image
cp .env.example .env.local
npm install
npm run dev
```
