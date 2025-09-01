import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import {
  determineVersion,
  versionWithPrefix,
  downloadClassHash,
  OsInfo,
} from "./util";
const axios = require("axios")

async function validateSubscription() {
  const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`

  try {
    await axios.get(API_URL, {timeout: 3000})
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      core.error(
        'Subscription is not valid. Reach out to support@stepsecurity.io'
      )
      process.exit(1)
    } else {
      core.info('Timeout or API not reachable. Continuing to next step.')
    }
  }
}

export default async function main() {
  try {
    await validateSubscription();
    const versionInput = core.getInput("version");
    core.info(`Input ${versionInput}`);

    const version = await determineVersion(versionInput);
    const osInfo = OsInfo();

    await core.group(
      `Setting up class-hash ${versionWithPrefix(version)}`,
      async () => {
        let pathToCli = tc.find("class-hash", version, osInfo);
        if (!pathToCli) {
          const downloadPath = await downloadClassHash(version);
          pathToCli = await tc.cacheDir(
            downloadPath,
            "class-hash",
            version,
            osInfo,
          );
        }

        core.addPath(pathToCli);
      },
    );
  } catch (error) {
    core.setFailed(error);
  }
}