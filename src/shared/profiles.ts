export type Profile = {
  id: string;
  name: string;
};

// Perfis fixos da extensao. Basta alterar este array para mudar as opcoes.
export const profiles: readonly Profile[] = [
  { id: "ana", name: "Ana" },
  { id: "bruno", name: "Bruno" },
  { id: "carla", name: "Carla" },
];

export const DEFAULT_PROFILE_ID = profiles[0].id;
