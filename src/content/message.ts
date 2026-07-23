import { getEffectiveProfileName, type Profile } from "../shared/profiles";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildKnownPrefixPattern(profiles: readonly Profile[]): RegExp {
  const profileNames = profiles
    .map((profile) => escapeRegExp(getEffectiveProfileName(profile)))
    .join("|");

  return new RegExp(
    `^(?:_?\\*?(?:${profileNames})\\*?_?:|_?\\*(?:${profileNames}):\\*_?)(?:\\s*\\n|\\s*$)`,
  );
}

export function buildOutgoingMessage(
  message: string,
  profileName: string,
  profiles: readonly Profile[],
  allowTagOnly = false,
): string {
  if (buildKnownPrefixPattern(profiles).test(message)) {
    return message;
  }

  const tag = `_*${profileName}:*_`;

  if (!message && allowTagOnly) {
    return tag;
  }

  return `${tag}\n${message}`;
}
