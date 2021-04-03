import { info, warning } from '@actions/core';
import { Context } from '@actions/github/lib/context';
import { GitHub } from '@actions/github/lib/utils';
import { PullRequestReviewState } from './enums/PullRequestReviewState';
import { IRunnable } from './interfaces/IRunnable';
import { PullRequestCheckFailed } from './models/PullRequestCheckFailed';

export class RequiredReviewerCheck implements IRunnable {
    constructor(
        private readonly inputs: { requiredReviewer: string },
        private readonly context: Context,
        private readonly octo: InstanceType<typeof GitHub>
    ) {}
    async run(): Promise<void> {
        const requiredReviewer = this.inputs.requiredReviewer;
        if (this.context.eventName !== 'pull_request') {
            throw new PullRequestCheckFailed(
                `Invalid event "${this.context.eventName}". This action is only for Pull Requests`
            );
        }
        if (!this.context.payload?.pull_request?.number) {
            throw new PullRequestCheckFailed(`Invalid event payload. Expected Pull Request Number`);
        }

        const reviews = await this.octo.pulls.listReviews({
            ...this.context.repo,
            pull_number: this.context.payload.pull_request.number,
        });

        const currentUserReviews: [username: string, reviewStatus: PullRequestReviewState][] = [];
        reviews.data.forEach((review) => {
            if (review.user && review.state !== PullRequestReviewState.Dismissed) {
                currentUserReviews.push([review.user.login, review.state as PullRequestReviewState]);
            }
        });
        const userReviewsStates = currentUserReviews.map(([, status]) => status);

        if (!currentUserReviews.map(([username]) => username).includes(requiredReviewer)) {
            await this.octo.pulls.requestReviewers({
                ...this.context.repo,
                pull_number: this.context.payload.pull_request.number,
                reviewers: [requiredReviewer],
            });
            throw new PullRequestCheckFailed(
                `Adding required reviewer "${requiredReviewer}". Please await their review.`
            );
        }

        if (userReviewsStates.includes(PullRequestReviewState.ChangesRequested)) {
            throw new PullRequestCheckFailed('Please implement the requested changes');
        }

        if (userReviewsStates.includes(PullRequestReviewState.Pending)) {
            warning('Warning: There are pending reviews');
        }

        const requiredApproval = currentUserReviews.find(
            ([username, status]) => status === PullRequestReviewState.Approved && username === requiredReviewer
        );
        if (!requiredApproval) {
            throw new PullRequestCheckFailed(`Please await the required review from ${requiredReviewer}`);
        } else {
            info('The pull request has the required review');
        }
        return;
    }
}
