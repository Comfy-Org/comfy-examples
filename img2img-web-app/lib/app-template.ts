export const appTemplate = {
  id: "image-transform",
  branding: {
    title: "Upscale\nanything.",
    description: "Upload an image and get a clean 4× high-resolution result.",
    action: "Upscale image",
  },
  fields: [
    {
      id: "image",
      type: "image",
      label: "Upload an image",
      accept: ["image/png", "image/jpeg", "image/webp"],
      required: true,
    },
  ],
  output: { type: "image", label: "Upscaled image" },
  workflow: {
    bindings: {
      image: { nodeId: "1", input: "image" },
    },
  },
} as const;

export function publicAppTemplate() {
  const { workflow, ...template } = appTemplate;
  return template;
}
