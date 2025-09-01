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

export async function fetchAndExtractTool(releaseVersion) {
  const platformString = OsInfo();
  const versionTag = versionWithPrefix(releaseVersion);
  const archiveFilename = `class-hash-${versionTag}-${platformString}`;
  const fileExtension = "tar.gz";
  const githubRepo = "ericnordelo/starknet-class-hash";
  const releaseUrl = `https://github.com/${githubRepo}/releases/download/${versionTag}/${archiveFilename}.${fileExtension}`;

  core.info(`Downloading class-hash from ${releaseUrl}`);
  const compressedFilePath = await tc.downloadTool(releaseUrl);
  const unpackedDirectory = await tc.extractTar(compressedFilePath);

  const toolDirectory = await locateInnerDirectory(unpackedDirectory);

  core.debug(`Extracted to ${toolDirectory}`);
  return toolDirectory;
}

async function locateInnerDirectory(parentPath) {
  const contents = await fs.readdir(parentPath, {
    withFileTypes: true,
  });

  for (const entry of contents) {
    if (entry.isDirectory()) {
      return path.join(parentPath, entry.name);
    }
  }

  throw new Error(`Could not find inner directory in ${parentPath}`);
}