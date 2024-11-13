# manual-approve

This is a github composite action to allow for manual approval via an issue.

Please note that this is a public repository visible to everyone. It does not and cannot contain anything sensitive.

## Description

When used the action will create an issue in the calling workflow repository. This issue requires a comment `approved` from anyone to continue or `rejected` to fail the workflow step.

## Usage

Example usage:

```yaml
jobs:
  test:
    name: Important job
    runs-on: scale
    steps:
      
      - name: Waiting for manual approval of (see Issues)
        uses: scaleaq/manual-approve@v1
        with:
          description: Please check the [output](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}) of the "Terraform show" step and verify that it does not contain unwanted changes.
          timeout-in-minutes: 5
```

Parameters:

* `description`: Optional, adds additional description to the issue.
* `timeout-in-minutes`: Optional, defines how long the action will wait for the approval before failing the step. Defaults to 30

## Important considerations
Due to limitations of github actions (it requires enterprise subscription for manual approval) this composite action was created. The downside is that it is using github actions minutes for waiting so should be used sparingly and timeout-in-minutes should be as little as possible. Please also approve fast 😊.

## Testing
There is a manually triggered workflow in `test.yml` that allows to test how this composite action works in this repository.

## How to publish
Client actions are using the tags to reference the composite action. To "update" the major version of the action like v1 e.g. one needs to delete the old tag and create it again with the same name but on another commit. Alternatively all semver tags can be referenced as well and all updates to action should have proper semver tags in addition to major tags like v1.
