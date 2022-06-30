let github;
let context;
let core;

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
    var body = "Add a comment `approved` or `rejected` to perform the corresponding action with the workflow step.";
    if (description) {
        body = `${description}\n\n${body}`;
    }

    var response = await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: `Request for approval from workflow "${context.workflow} #${context.runNumber}"`,
        body: body
    });
    var issueNumber = response.data.number;
    debugLog("Create issue response", response);
    console.log(`Created issue ${issueNumber}. Awaiting approval.`);

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

async function createIssueAndWaitForApproval({ timeoutInMinutes, description }) {
    var issue = await createIssue(description);
    var isApproved = await waitForApproval(issue.number, timeoutInMinutes);
    await closeIssue(issue, isApproved);

    if (isApproved) {
        console.log(`The issue ${issue.number} has been approved.`);
    } else {
        throw `The issue ${issue.number} has not been approved.`;
    }
}

module.exports = async (scriptContext) => {
    github = scriptContext.github;
    context = scriptContext.context;
    core = scriptContext.core;

    const scriptInputs = {
        timeoutInMinutes: parseInt(core.getInput("timeout-in-minutes", { required: true })),
        description: core.getInput("description", { required: false })
    };

    await createIssueAndWaitForApproval(scriptInputs);
}