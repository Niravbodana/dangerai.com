/** Family profiles for multi-diet household planning */
const KEY = "akb-family-profiles";

export function getFamilyProfiles() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    if (data?.members?.length) return data;
  } catch {
    /* fall through */
  }
  return {
    members: [
      { id: "self", name: "Main", diet: "veg", spice: "medium", role: "cook" },
    ],
    activeId: "self",
  };
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function addFamilyMember({ name, diet = "veg", spice = "medium", role = "family" }) {
  const data = getFamilyProfiles();
  const id = `m-${Date.now()}`;
  data.members.push({ id, name, diet, spice, role });
  save(data);
  return data;
}

export function updateFamilyMember(id, partial) {
  const data = getFamilyProfiles();
  data.members = data.members.map((m) => (m.id === id ? { ...m, ...partial } : m));
  save(data);
  return data;
}

export function removeFamilyMember(id) {
  const data = getFamilyProfiles();
  if (data.members.length <= 1) return data;
  data.members = data.members.filter((m) => m.id !== id);
  if (data.activeId === id) data.activeId = data.members[0].id;
  save(data);
  return data;
}

export function setActiveMember(id) {
  const data = getFamilyProfiles();
  data.activeId = id;
  save(data);
  return data;
}

export function getActiveMember() {
  const data = getFamilyProfiles();
  return data.members.find((m) => m.id === data.activeId) || data.members[0];
}

/** Diet that works for whole family (intersection bias) */
export function getFamilySafeDiet() {
  const { members } = getFamilyProfiles();
  if (members.every((m) => m.diet === "veg" || m.diet === "jain")) return "veg";
  return "all";
}
