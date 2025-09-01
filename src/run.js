import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import {
  determineVersion,
  versionWithPrefix,
  fetchAndExtractTool,
  OsInfo,
} from "./util";
const axios = require("axios")

async function validateSubscription() {
  const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`

  try {
    await axios.get(API_URL, {timeout: 3000})
  } catch (error) {
    if (error.response && error.response.status === 403) {
      core.error(
        'Subscription is not valid. Reach out to support@stepsecurity.io'
      )
      process.exit(1)
    } else {
      core.info('Timeout or API not reachable. Continuing to next step.')
    }
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