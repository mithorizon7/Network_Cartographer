export function assertSupportedRuntime(version = process.versions.node): void {
  const [major, minor, patch] = version.split(".").map(Number);
  const supported =
    (major === 22 && (minor > 23 || (minor === 23 && patch >= 4))) ||
    (major === 24 && (minor > 22 || (minor === 22 && patch >= 1)));

  if (!supported) {
    throw new Error(
      `Node ${version} is not a supported security baseline. Use Node 22.23.4+ (22.x) or 24.22.1+ (24.x).`,
    );
  }
}
