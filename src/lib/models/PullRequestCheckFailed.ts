import { setFailed } from '@actions/core';
export class PullRequestCheckFailed extends Error {
    readonly name = 'PullRequestCheckFailed';
    constructor(message: string) {
        super(message);
        setFailed(message);
    }
}
