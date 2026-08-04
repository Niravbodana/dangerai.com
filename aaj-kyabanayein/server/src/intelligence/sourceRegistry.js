/** Source registry stub — pipeline imports removed. */
export function seedSourceRegistry() {
  /* no-op */
}

export function validateAndRegisterSource() {
  return { allowed: false, reason: "Pipeline removed" };
}

export function listSources() {
  return [];
}

export function getSourceById() {
  return null;
}
