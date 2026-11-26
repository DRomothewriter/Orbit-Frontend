import { Pipe, PipeTransform } from '@angular/core';

export const ASTRONOMICAL_DEFAULT_AVATARS = [
  'assets/avatars/nebula.webp',
  'assets/avatars/galaxy.webp',
  'assets/avatars/ringed-planet.webp',
  'assets/avatars/comet.webp',
  'assets/avatars/constellation.webp',
  'assets/avatars/eclipse.webp',
  'assets/avatars/amethyst-cloud.webp',
  'assets/avatars/star-cluster.webp',
  'assets/avatars/planetary-limb.webp',
  'assets/avatars/golden-nebula.webp',
  'assets/avatars/violet-arc.webp',
  'assets/avatars/deep-zenith.webp',
  'assets/avatars/milky-way-core.webp',
  'assets/avatars/twilight-rift.webp',
  'assets/avatars/lavender-veil.webp',
  'assets/avatars/champagne-dust.webp',
  'assets/avatars/indigo-stars.webp',
  'assets/avatars/starlight-field.webp',
  'assets/avatars/nocturne-mist.webp',
  'assets/avatars/cosmic-drift.webp',
  'assets/avatars/spiral-core.webp',
  'assets/avatars/comet-tail.webp',
  'assets/avatars/crescent-ring.webp',
  'assets/avatars/solar-corona.webp',
] as const;

export function pickAstronomicalAvatar(seed?: string | null): string {
  const key = (seed || 'orbit').trim();
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return ASTRONOMICAL_DEFAULT_AVATARS[hash % ASTRONOMICAL_DEFAULT_AVATARS.length];
}

export function resolveOrbitAvatar(
  url?: string | null,
  seed?: string | null
): string {
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (
    !trimmed ||
    trimmed.includes('placehold.co') ||
    trimmed.includes('googleusercontent.com')
  ) {
    return pickAstronomicalAvatar(seed);
  }
  return trimmed;
}

@Pipe({
  name: 'orbitAvatar',
  standalone: true,
})
export class OrbitAvatarPipe implements PipeTransform {
  transform(url?: string | null, seed?: string | null): string {
    return resolveOrbitAvatar(url, seed);
  }
}
