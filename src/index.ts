import { getInput, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { IRunnable } from './lib/interfaces/IRunnable';
import { PullRequestCheckFailed } from './lib/models/PullRequestCheckFailed';
import { RequiredReviewerCheck } from './lib/RequiredReviewer';

async function run() {
    try {
        const gitHubToken = getInput('token');
        const checks: IRunnable[] = [
            new RequiredReviewerCheck(
                {
                    requiredReviewer: getInput('requiredReviewer'),
                },
                context,
                getOctokit(gitHubToken)
            ),
        ];
        for (const check of checks) {
            await check.run();
        }
    } catch (e) {
        if (e instanceof PullRequestCheckFailed === false) {
            setFailed(`Unexpected error: "${e.message}"`);
        }
    }
}

run().catch((reason) => {
    setFailed(`Exception: ${reason}`);
});
