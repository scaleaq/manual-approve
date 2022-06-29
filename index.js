let github;

const isDebug = process.env.ACTIONS_RUNNER_DEBUG;

function debugLog(...args) {
    if (isDebug) {
        console.log(...args);
    }
}

async function getComments(issueNumber) {
    var response = await github.rest.issues.listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNumber
    });
    debugLog("Get comments response", response);
    return response.data;
}

async function waitForApproval(issueNumber, timeoutInMinutes) {
    const timer = ms => new Promise(res => setTimeout(res, ms));
    
    const operationTimeout = timeoutInMinutes * 1000 * 60;

    var iterationTimeout = 5000;
    var iterations = operationTimeout / iterationTimeout;

    debugLog(`Maximum number of waiting iterations: ${iterations}.`);

    for (var i = 0; i < iterations; i++) {
        await timer(iterationTimeout);
        debugLog(`Iteration ${i}`);
        var comments = await getComments(issueNumber);
        if (comments.findIndex(c => c.body == 'approved') != -1) {
            return true;
        }
        if (comments.findIndex(c => c.body == 'rejected') != -1) {
            return false;
        }
    }

    return false;
}

async function createIssue() {
    var response = await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: "Request for approval from github action",
        body: "To approve the request add a comment `approved`, to reject the request add a comment `rejected`"
    });
    debugLog("Create issue response", response);
    console.log(`Created issue ${issue.number}. Awaiting approval.`);
    return response.data;
}

async function closeIssue(issue, isApproved) {
    var response = await github.rest.issues.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issue.number,
        title: issue.title + (isApproved ? ' (Approved)' : ' (Rejected/Timed out)'),
        state: "closed"
    });
    debugLog(`Close issue ${issue.number} response`, response);
}

async function createIssueAndWaitForApproval(timeoutInMinutes) {
    var issue = await createIssue();
    var isApproved = await waitForApproval(issue.number, timeoutInMinutes);
    await closeIssue(issue, isApproved);

    if (isApproved) {
        console.log(`The issue ${issue.number} has been approved.`);
    } else {
        throw `The issue ${issue.number} has not been approved.`;
    }
}

module.exports = async (context, {timeoutInMinutes}) => {
    github = context.github;
    await createIssueAndWaitForApproval(timeoutInMinutes);
}