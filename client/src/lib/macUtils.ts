export function formatMac(localId: string, showFull: boolean): string {
  if (showFull) return localId;
  const parts = localId.split(":").filter(Boolean);
  if (parts.length >= 3) {
    return parts.slice(-3).join(":");
  }
  return localId.slice(-8);
}
