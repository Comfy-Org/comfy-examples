# Text-to-image workflow

`workflow_api.json` is an API-format text-to-image example with a `SaveImage`
output. Replace it with another API-format workflow to change what
`/imagine` produces.

The Discord bot binds its `/imagine` prompt to `30:19.value`, which feeds the
workflow's prompt-expansion stage. To bypass expansion, bind the bot directly
to `30:6.text` instead.
