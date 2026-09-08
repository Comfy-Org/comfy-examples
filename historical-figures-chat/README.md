# The Record — historical figures chat

An eight-person index that opens into a correspondence view. A visitor chooses a historical figure, asks a question, and receives a short H3-rendered video response.

```text
browser message → protected Next.js API → Comfy SDK → LLM + H3 workflow → job polling → video in chat
```

## Experience

- Eight portrait cards provide entry points: Ada Lovelace, Frederick Douglass, Cleopatra VII, Leonardo da Vinci, Harriet Tubman, Nikola Tesla, Marie Curie, and James Baldwin.
- The chat keeps the most recent twelve entries, limits input to 1,000 characters, and gives each figure a historically bounded system brief. The workflow exposes video rather than the generated dialogue text, so follow-up prompts include the visitor's question history but do not invent or claim a transcript of prior replies.
- The browser never receives the Comfy API key or workflow graph. It only receives a job ID, status, and output URLs.
- Video generation is asynchronous. The UI polls the job until its terminal state and renders the returned `SaveVideo` output inline.
- Follow-up questions send the previous job ID to the server. The server resolves that job's expected `SaveVideo` output through the Comfy SDK, streams a size-limited copy, and uses its final frame as the next H3 image-to-video source. The server needs FFmpeg available; configure `FFMPEG_PATH` when it is not on `PATH`.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `COMFY_BASE_URL` and `COMFY_API_KEY` in `.env.local`. The sample uses the same Comfy SDK server-side integration as the other web-app examples.

## Prepare the Comfy deployment

This sample uses Comfy Cloud's built-in SmolLM2 and MiniMax H3 nodes. Each completed response consumes Cloud compute credits, so confirm that the deployment/account has access to the required nodes before sending visitors to it:

1. An LLM/script node that turns the persona brief and conversation into a ≤55-word spoken response.
2. An image-to-video H3 stage with the selected portrait held as the identity reference.
3. Any speech or lip-sync stage required by the chosen H3 workflow.
4. A terminal `SaveVideo` node.

The checked-in [workflow_api.json](workflows/workflow_api.json) is validated against the current Cloud node catalog. Its editable source canvas and regeneration details are in [workflows/README.md](workflows/README.md).

## Verify

```bash
npm test
npm run build
```
