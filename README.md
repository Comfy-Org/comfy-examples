# Comfy examples

Standalone applications built with the Comfy API.

## Examples

| Example | What it does | Deploy |
| --- | --- | --- |
| [impossible-food-network](impossible-food-network) | Upload a meal and turn it into a surreal food commercial with a hero image and six-second video. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fimpossible-food-network&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |
| [anime-opening-machine](anime-opening-machine) | Turn one or two character references and a theme into an eight-frame anime storyboard, then animate selected shots into a looping music video. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fanime-opening-machine&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |
| [comfy-radio](comfy-radio) | Tune a vintage-style radio and generate original channel-specific music with Comfy Cloud. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fcomfy-radio&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |
| [virtual-try-on](virtual-try-on) | Upload a person photo and garment photo to create a virtual try-on with Comfy Cloud. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fvirtual-try-on&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |
| [smile-compliance](smile-compliance) | Apply mandatory cheer to a person, pet, object, or piece of produce. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fsmile-compliance&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |
| [img2img-web-app](img2img-web-app) | Upload an image and run a Comfy image workflow. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fimg2img-web-app&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |
| [object-removal](object-removal) | Mark an object in an image and reconstruct the background. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fobject-removal&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |
| [room-remix](room-remix) | Pick a room style, arrange furniture, and generate a Comfy Cloud room makeover. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Froom-remix&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |
| [museum-of-bad-ideas](museum-of-bad-ideas) | Turn an intentionally bad doodle into a museum-worthy image in six styles. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fmuseum-of-bad-ideas&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |
| [sketch-to-image](sketch-to-image) | Draw a guide and generate a matching image. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fsketch-to-image&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |
| [discord-image-bot](discord-image-bot) | Run a Discord `/imagine` bot backed by a Comfy workflow. | [Deploy to Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples) |
| [historical-figures-chat](historical-figures-chat) | Chat with a historical figure and receive a ComfyUI-rendered video response. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fhistorical-figures-chat&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.&project-name=comfy-historical-figures-chat&repository-name=comfy-historical-figures-chat) |
| [profile-picture-generator](profile-picture-generator) | Upload a portrait, choose a cosmic style, and generate eight profile pictures with Comfy Cloud. | [Deploy to Vercel](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FComfy-Org%2Fcomfy-examples%2Ftree%2Fmain%2Fprofile-picture-generator&env=COMFY_API_KEY&envDescription=Enter+your+Comfy+API+key.) |

Deployments are public and use your Comfy credits. Protect them before sharing.

## Local development

```bash
cd sketch-to-image
cp .env.example .env.local
npm install
npm run dev
```
