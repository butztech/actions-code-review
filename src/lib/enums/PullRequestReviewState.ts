export enum PullRequestReviewState {
    /** A review allowing the pull request to merge. */
    Approved = 'APPROVED',
    /** A review blocking the pull request from merging. */
    ChangesRequested = 'CHANGES_REQUESTED',
    /** An informational review. */
    Commented = 'COMMENTED',
    /** A review that has been dismissed. */
    Dismissed = 'DISMISSED',
    /** A review that has not yet been submitted. */
    Pending = 'PENDING',
}
