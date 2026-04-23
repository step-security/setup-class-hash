import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import fs from "fs";
import {
  determineVersion,
  versionWithPrefix,
  fetchAndExtractTool,
  OsInfo,
} from "./util";
const axios = require("axios")

async function validateSubscription() {
  let repoPrivate;
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (eventPath && fs.existsSync(eventPath)) {
    const payload = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    repoPrivate = payload?.repository?.private;
  }

  const upstream = "ericnordelo/starknet-class-hash";
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl =
    "https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions";

  core.info("");
  core.info("[1;36mStepSecurity Maintained Action[0m");
  core.info(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false)
    core.info("[32m✓ Free for public repositories[0m");
  core.info(`[36mLearn more:[0m ${docsUrl}`);
  core.info("");

  if (repoPrivate === false) return;
  const serverUrl = process.env.GITHUB_SERVER_URL || "https://github.com";
  const body = { action: action || "" };

  if (serverUrl !== "https://github.com") body.ghes_server = serverUrl;
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      { timeout: 3000 },
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `[1;31mThis action requires a StepSecurity subscription for private repositories.[0m`,
      );
      core.error(
        `[31mLearn how to enable a subscription: ${docsUrl}[0m`,
      );
      process.exit(1);
    }
    core.info("Timeout or API not reachable. Continuing to next step.");
  }
}

async function setupClassHashTool(processedVersion, systemInfo) {
  const cachedPath = tc.find("class-hash", processedVersion, systemInfo);
  
  if (cachedPath) {
    return cachedPath;
  }

  const downloadedPath = await fetchAndExtractTool(processedVersion);
  const finalPath = await tc.cacheDir(
    downloadedPath,
    "class-hash",
    processedVersion,
    systemInfo,
  );
  
  return finalPath;
}

export default async function run() {
  try {
    await validateSubscription();
    
    const inputVersion = core.getInput("version");
    core.info(`Input ${inputVersion}`);

    const processedVersion = await determineVersion(inputVersion);
    const systemInfo = OsInfo();
    const displayVersion = versionWithPrefix(processedVersion);

    await core.group(`Setting up class-hash ${displayVersion}`, async () => {
      const toolPath = await setupClassHashTool(processedVersion, systemInfo);
      core.addPath(toolPath);
    });
  } catch (error) {
    core.setFailed(error);
  }
}