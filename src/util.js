import os from "os";
import path from "path";
import fs from "fs/promises";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";

export async function determineVersion(version) {
  const trimmedVersion = version?.trim();

  if (trimmedVersion.startsWith("v")) {
    return trimmedVersion.substring(1);
  }

  return trimmedVersion;
}

export function versionWithPrefix(version) {
  return /^\d/.test(version) ? `v${version}` : version;
}

export function OsInfo() {
  const currentArch = os.arch();
  const currentPlatform = os.platform();

  let architecture;
  switch (currentArch) {
    case "arm64":
      architecture = "aarch64";
      break;
    case "x64":
      architecture = "x86_64";
      break;
    default:
      throw new Error(`host architecture: ${currentArch} is not supported`);
  }

  let platformInfo;
  switch (currentPlatform) {
    case "linux":
      platformInfo = "unknown-linux-gnu";
      break;
    case "darwin":
      platformInfo = "apple-darwin";
      break;
    default:
      throw new Error(`host platform: ${currentPlatform} is not supported`);
  }

  return `${architecture}-${platformInfo}`;
}

export async function downloadClassHash(version) {
  const osInfo = OsInfo();
  const tag = versionWithPrefix(version);
  const basename = `class-hash-${tag}-${osInfo}`;
  const extension = "tar.gz";
  const repository = "ericnordelo/starknet-class-hash";
  const downloadUrl = `https://github.com/${repository}/releases/download/${tag}/${basename}.${extension}`;

  core.info(`Downloading class-hash from ${downloadUrl}`);
  const pathToTarball = await tc.downloadTool(downloadUrl);
  const extractedPath = await tc.extractTar(pathToTarball);

  const pathToCli = await findDirectory(extractedPath);

  core.debug(`Extracted to ${pathToCli}`);
  return pathToCli;
}

async function findDirectory(extractedPath) {
  const dirEntries = await fs.readdir(extractedPath, {
    withFileTypes: true,
  });

  for (const dir of dirEntries) {
    if (dir.isDirectory()) {
      return path.join(extractedPath, dir.name);
    }
  }

  throw new Error(`Could not find inner directory in ${extractedPath}`);
}