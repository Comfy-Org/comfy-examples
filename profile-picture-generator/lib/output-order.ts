export function orderBundleOutputs<T extends { name: string }>(outputs: T[]) {
  return outputs
    .map((output, originalOrder) => {
      const item = /(?:^|\/)(\d{2})_/.exec(output.name);
      return { output, itemOrder: item ? Number(item[1]) : Number.POSITIVE_INFINITY, originalOrder };
    })
    .sort((a, b) => a.itemOrder - b.itemOrder || a.originalOrder - b.originalOrder)
    .map(({ output }) => output);
}
