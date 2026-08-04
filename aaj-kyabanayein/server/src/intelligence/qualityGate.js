/** Quality gate stub — pipelines removed. */
export function runQualityGate(recipe) {
  return {
    passed: true,
    issues: [],
    scores: { quality: 1 },
  };
}
