export type Profile = {
  id: string;
  name: string;
};

// Mantemos tres slots fixos internamente, mas os nomes podem ser personalizados no popup.
export const DEFAULT_PROFILES: readonly Profile[] = [
  { id: "ana", name: "Ana" },
  { id: "bruno", name: "Bruno" },
  { id: "carla", name: "Carla" },
];

export const profiles = DEFAULT_PROFILES;
export const DEFAULT_PROFILE_ID = DEFAULT_PROFILES[0].id;

export function cloneDefaultProfiles(): Profile[] {
  return DEFAULT_PROFILES.map((profile) => ({ ...profile }));
}

export function isKnownProfileId(profileId: string): boolean {
  return DEFAULT_PROFILES.some((profile) => profile.id === profileId);
}

export function getDefaultProfileName(profileId: string): string {
  return DEFAULT_PROFILES.find((profile) => profile.id === profileId)?.name ?? DEFAULT_PROFILES[0].name;
}

export function getEffectiveProfileName(profile: Profile): string {
  const normalizedName = profile.name.trim();
  return normalizedName || getDefaultProfileName(profile.id);
}

// Garante que o storage sempre tenha exatamente os tres perfis esperados e com nomes validos.
export function normalizeProfiles(value: unknown): Profile[] {
  const incomingProfiles = Array.isArray(value) ? value : [];

  return DEFAULT_PROFILES.map((defaultProfile) => {
    const incomingProfile = incomingProfiles.find((profile) => {
      return typeof profile === "object" && profile !== null && "id" in profile && profile.id === defaultProfile.id;
    }) as Partial<Profile> | undefined;

    return {
      id: defaultProfile.id,
      name: getEffectiveProfileName({
        id: defaultProfile.id,
        name: typeof incomingProfile?.name === "string" ? incomingProfile.name : defaultProfile.name,
      }),
    };
  });
}
