{ pkgs }:
let
  version = builtins.replaceStrings [ "\r" "\n" ] [ "" "" ] (builtins.readFile ./.nvmrc);
  system = pkgs.stdenv.hostPlatform.system;
  archive =
    if version != "22.23.4" then
      throw "Review the official Node archive checksums when changing .nvmrc."
    else if system == "x86_64-linux" then {
      arch = "x64";
      sha256 = "1805bcd35e6815559bd2eb97db438d3fdb0eb3a5e6a977b7c1badca76337e9ce";
    } else if system == "aarch64-linux" then {
      arch = "arm64";
      sha256 = "6287aa46b6c375d816e63ae66d024fbbfd70404825aabdfdf898a970871d2f4b";
    } else
      throw "Unsupported Replit Node runtime platform: ${system}";

  # Provision patched Node before Replit's own publishing installer can run.
  node = pkgs.stdenvNoCC.mkDerivation {
    pname = "nodejs-security-baseline";
    inherit version;
    src = pkgs.fetchurl {
      url = "https://nodejs.org/dist/v${version}/node-v${version}-linux-${archive.arch}.tar.xz";
      inherit (archive) sha256;
    };
    nativeBuildInputs = [ pkgs.autoPatchelfHook ];
    buildInputs = [ pkgs.stdenv.cc.cc.lib ];
    dontBuild = true;
    dontPatchShebangs = true;
    installPhase = ''
      runHook preInstall
      mkdir -p "$out"
      cp -r ./. "$out/"
      runHook postInstall
    '';
    meta = {
      description = "Checksum-pinned patched Node for the Replit publishing pipeline";
      homepage = "https://nodejs.org/";
      license = pkgs.lib.licenses.mit;
      platforms = [ "x86_64-linux" "aarch64-linux" ];
      mainProgram = "node";
    };
  };
in
{
  deps = [ node ];
}
