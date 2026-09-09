# Historical figures H3 workflow

`workflow_api.json` is the validated API export consumed by the web app. It is derived from Comfy's `video_minimax_h3_i2v` template and uses Comfy Cloud's built-in SmolLM2 node to make the incoming conversation usable as a concise H3 production prompt.

The web app injects these inputs:

| Node ID | Input | Value |
| --- | --- | --- |
| `114` | `image` | selected portrait, uploaded as a Comfy asset |
| `2585308530609103` | `system_prompt` | historical persona and safety constraints |
| `2585308530609103` | `user_prompt` | recent visitor questions and a request for spoken words only |

Build the graph as one server-side workflow:

```text
portrait asset ───────────────────────────────────────────────────────────────────┐
persona brief + conversation → SmolLM2 dialogue → fixed H3 speech wrapper ───────┼→ MiniMax H3 image-to-video → SaveVideo
portrait asset ────────────────────────────────────────────┘
```

SmolLM2 returns only the compact spoken line. Two core `StringConcatenate` nodes wrap it in H3's speaker, dialogue, soundscape, and no-music format. MiniMax H3 uses the portrait as its identity reference and generates the video with native audio. The terminal `SaveVideo` node exposes the output URL to the SDK.

The graph does not expose SmolLM2's line as a separate text output. The app therefore keeps prior replies as video entries and sends only visitor questions back into later prompts; it never substitutes a placeholder as dialogue spoken by the figure.

The source canvas export is [historical-figures.ui.json](historical-figures.ui.json); the structured changes are recorded in [historical-figures.recipe.json](historical-figures.recipe.json). `workflow_api.json` is the authoritative app artifact: the current Cloud converter shifts SmolLM2 widget values after its linked model input, so its six static generation fields are corrected in the exported API graph and then validated. Keep the bindings above in sync with [lib/comfy.ts](../lib/comfy.ts).
