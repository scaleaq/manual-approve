let github;
let context;

const isDebug = process.env.RUNNER_DEBUG;

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

async function createIssue(description) {
    var response = await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: `Request for approval from workflow ${context.workflow} #${context.runNumber}`,
        body: "To approve the workflow step add a comment `approved` or `rejected` to reject"
    });
    var issueNumber = response.data.number;
    debugLog("Create issue response", response);
    console.log(`Created issue ${issueNumber}. Awaiting approval.`);

    if (description) {
        await createComment(issueNumber, description);
    }

    return response.data;
}

async function createComment(issueNumber, body) {
    var response = await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: issueNumber,
        body: body
    });    
    debugLog("Create issue comment response", response);
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

async function createIssueAndWaitForApproval({timeoutInMinutes, description}) {
    var issue = await createIssue(description);
    var isApproved = await waitForApproval(issue.number, timeoutInMinutes);
    await closeIssue(issue, isApproved);

    if (isApproved) {
        console.log(`The issue ${issue.number} has been approved.`);
    } else {
        throw `The issue ${issue.number} has not been approved.`;
    }
}

module.exports = async (scriptContext, scriptInputs) => {
    github = scriptContext.github;
    context = scriptContext.context;
    await createIssueAndWaitForApproval(scriptInputs);
}