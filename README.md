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
    runs-on: ubuntu-latest
    steps:
      
      - name: Waiting for manual approval of (see Issues)
        uses: scaleaq/manual-approve@v1
        with:
          description: Please check the [output](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}) of the Show step and verify that it does not contain unwanted changes.
          timeout-in-minutes: 5
```

Parameters:

* `description`: Optional, adds additional description to the issue
* `timeout-in-minutes`: Optional, set by default to 10

## Important considerations
Due to limitations of github actions (it requires enterprise subscription for manual approval) this composite action was created. The downside is that it is using github actions minutes for waiting so should be used sparingly and timeout-in-minutes should be as little as possible. Please also approve fast :)
