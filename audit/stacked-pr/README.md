# Stacked PR accessibility audit: all 17 UI paths

Repository: https://github.com/Teamelite12/Pull-Request-Testing

These are fixtures for GitHub's built-in UI, not a local mock website. Native stack membership, branch relationships, and timeline events were checked through the GitHub API. The signed-in browser dialogs and final control labels have not been visually verified by this session.

**Not all scenarios are ready:** scenarios 9, 11, 12, and 13 need administrator setup. The GitHub App session received HTTP 403 for ruleset creation and repository-setting changes. This is a session permission limitation, not a statement about the user's own administrator permissions.

Main and pre-existing PRs were left unchanged. Only documentation-only audit branches and new PRs were added. Merge, rebase, and unstack audit actions are intentionally left for the auditor, except that the separate S16 fixture was unstacked to create real removal events.

Existing repository workflows already contain failures (including an npm test job without a package manifest and an invalid workflow). The setup did not alter them. These checks are not configured as required on the unprotected audit bases. Do not treat those failures as the missing-review or merge-queue UI.

| # | Scenario | Open URL | Simple UI path | Readiness |
|---|---|---|---|---|
| 1 | Create Stack from Existing PRs | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/70) | Open the upper PR > Create stack recommendation > stack preview > confirm. | Prepared |
| 2 | Create Stack with a New PR | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/compare/audit/stacked-20261118/s02/layer-1...audit/stacked-20261118/s02/layer-2?expand=1) | Open the prepared comparison > Create pull request > Create stack. | Prepared |
| 3 | Stack Header | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/73) | Open the upper PR > stack icon and layer number beside the PR title. | Prepared |
| 4 | Stack Context in PR List | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pulls?q=is%3Apr%20is%3Aopen%20S03) | Pull requests > search S03 > stack indicator beside a matching PR. | Prepared |
| 5 | Stack Map | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/73) | Open the upper PR > merge section at the bottom > stack map. | Prepared |
| 6 | Stack Keyboard Shortcuts | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/73) | Open the upper PR > Shift+J and Shift+K > destination PR header. | Prepared |
| 7 | Add to Stack | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/76) | Open the upper PR > stack icon > Add to stack > prepared third branch. | Prepared |
| 8 | Rebase Stack | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/79) | Open the upper PR > merge section > Rebase stack > confirmation and status. | Prepared; approval subcase needs administrator and reviewer |
| 9 | Stack Merge Requirements | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/82) | After setup: open the upper PR > merge section > required review/check details. | Blocked: administrator configuration |
| 10 | Merge Stack | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/85) | Open the upper PR > merge section > merge method > confirmation. | Prepared; merge not executed |
| 11 | Bypass Stack Merge Requirements | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/87) | After setup: open the lowest PR > merge restriction > bypass option > confirmation. | Blocked: administrator configuration |
| 12 | Stack Merge Queue | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/91) | After setup: open the upper PR > queue action > queue status/details > merge group. | Blocked: administrator configuration |
| 13 | Stack Auto-merge | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/94) | After setup: open the upper PR > PR-group selection > auto-merge > confirmation/cancel. | Blocked: administrator configuration; availability conditional |
| 14 | Partial Merge and Automatic Retargeting | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/96) | Open the bottom PR > merge only that PR > open the remaining upper PR. | Prepared; merge not executed |
| 15 | Branching Stack Retargeting | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/102) | Merge the S15P bottom PR > delete its audit branch > open the S15 bottom PR. | Prepared; prerequisite merge/deletion not executed |
| 16 | Stack Membership Timeline | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/105) | Open S16 layer 1 > PR activity timeline > added/removed stack events. | Prepared: added and removed events exist |
| 17 | Unstack Pull Requests | [Open UI](https://github.com/Teamelite12/Pull-Request-Testing/pull/109) | Open the upper PR > stack options > Unstack > confirmation > resulting PR state. | Prepared; unstack not executed |

## Administrator setup for blocked controls

Open URL: https://github.com/Teamelite12/Pull-Request-Testing/settings/rules

Go to Settings > Rules > Rulesets > New ruleset > New branch ruleset. Set enforcement to Active. Under Target branches, include only the exact branch below, using Include by pattern. Do not target main or all branches.

### Scenario 8 (approval-retention subcase)

Target branch: `audit/stacked-20261118/rebase-base`

Require a pull request before merging > require 1 approval > dismiss stale approvals when new commits are pushed. A different authorized reviewer must approve the unchanged PRs before the auditor selects Rebase stack.

### Scenario 9

Target branch: `audit/stacked-20261118/requirements-base`

Require a pull request before merging > require 1 approval. Leave the bypass list empty. Save, then reopen the stack's merge section to find the required-review restriction.

### Scenario 11

Target branch: `audit/stacked-20261118/bypass-base`

Require a pull request before merging > require 1 approval. Under Bypass list, add the approved repository administrator role with Always allow. Save and open the stack's lowest unmerged PR using that authorized account.

### Scenario 12

Target branch: `audit/stacked-20261118/queue-base`

Enable Require merge queue and the associated pull-request rule. Save, then reopen the upper PR. If required checks are added, their workflow must support the merge_group event; the existing workflows do not. If the merge-queue rule is unavailable for the repository or plan, record the scenario as blocked.

### Scenario 13

Target branch: `audit/stacked-20261118/auto-base`

Require a pull request before merging > require 1 approval, without an always-allow bypass. Save. Then open https://github.com/Teamelite12/Pull-Request-Testing/settings > General > Pull Requests > enable Allow auto-merge. Return to the upper PR and check for the stack-specific group-selection and auto-merge controls. Do not grant the approval until the intended auto-merge/cancel state has been audited.

## Scenario steps and remarks

### 1. Create Stack from Existing PRs

**Fixture:** S01 | **Readiness:** Prepared

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/70
2. Navigate to the Create stack recommendation above the PR activity and select it.
3. Navigate to the PRs and controls in the stack preview dialog.
4. Confirm the two-PR stack using the available creation control.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** The two dependent PRs are intentionally unstacked. Do not use this fixture for scenario 2.

### 2. Create Stack with a New PR

**Fixture:** S02 | **Readiness:** Prepared

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/compare/audit/stacked-20261118/s02/layer-1...audit/stacked-20261118/s02/layer-2?expand=1
2. Navigate to the base and compare branch controls and select the prepared branches.
3. Select Create pull request and enter a title and description.
4. Select Create stack and complete creation using the displayed controls.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** The lower PR is https://github.com/Teamelite12/Pull-Request-Testing/pull/71. The base is `audit/stacked-20261118/s02/layer-1` and the compare branch is `audit/stacked-20261118/s02/layer-2`. The upper PR has not been created.

### 3. Stack Header

**Fixture:** S03 | **Readiness:** Prepared

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/73
2. Navigate to the stack icon and layer number in the PR header and select it.
3. Navigate to the stack details, PR links, and available controls.
4. Close the stack details using the available dismissal control.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** Uses a verified native two-PR stack. The persistent header is on the same PR page.

### 4. Stack Context in PR List

**Fixture:** S03 | **Readiness:** Prepared

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pulls?q=is%3Apr%20is%3Aopen%20S03
2. Navigate to the stack indicator beside an S03 pull request and select it.
3. Navigate to the stack details and status information displayed.
4. Select a PR link from the stack details.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** Both S03 PRs belong to the same native stack.

### 5. Stack Map

**Fixture:** S03 | **Readiness:** Prepared

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/73
2. Navigate to the stack map and contents present in the merge section.
3. Navigate to the PR links, layer order, and status information.
4. Select the other PR in the stack.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** Use the same S03 native stack; a separate page is not required.

### 6. Stack Keyboard Shortcuts

**Fixture:** S03 | **Readiness:** Prepared

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/73
2. Use Shift+J to navigate to another PR in the stack.
3. Use Shift+K to navigate in the opposite direction.
4. Navigate to the destination PR title and current stack layer.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** The two PRs provide both stack boundaries.

### 7. Add to Stack

**Fixture:** S07 | **Readiness:** Prepared

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/76
2. Navigate to the stack icon in the header, select it, and select Add to stack.
3. Navigate to the branch controls and select `audit/stacked-20261118/s07/layer-3`.
4. Complete the PR title and description and select Add to stack.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** The third branch is already pushed. No third PR exists yet.

### 8. Rebase Stack

**Fixture:** S08 | **Readiness:** Prepared; approval subcase needs administrator and reviewer

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/79
2. Navigate to Rebase stack in the merge section and select it.
3. Navigate to the confirmation controls and complete the rebase.
4. Navigate to the resulting progress, completion or conflict message, reviews, and commit details.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** The audit base is one commit ahead of the bottom layer's fork point. For approval retention, first use the administrator instructions below and have a different authorized reviewer approve the unchanged PRs. After the native rebase, inspect the replacement commits' signature/Verified details. Initial API-created commits are unsigned; signed replacement commits have not been generated or verified yet.

### 9. Stack Merge Requirements

**Fixture:** S09 | **Readiness:** Blocked: administrator configuration

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/82
2. Navigate to the merge requirements and blocking message in the merge section.
3. Select the available review or required-check details link.
4. Navigate to the unavailable merge action and its explanation.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** The stack exists, but no required-review rule could be created. Existing workflow failures are not a substitute for required merge restrictions. Apply the S09 setup below first.

### 10. Merge Stack

**Fixture:** S10 | **Readiness:** Prepared; merge not executed

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/85
2. Navigate to the stack merge controls and inspect the two PRs selected to merge.
3. Navigate to the merge method menu and confirmation controls.
4. Confirm the approved audit merge and navigate to the resulting status.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** Both PRs target the audit stack base `audit/stacked-20261118/merge-base`, not main. The repository has pre-existing failing workflows; no rule requires those checks on this base. Do not change the destination to main.

### 11. Bypass Stack Merge Requirements

**Fixture:** S11 | **Readiness:** Blocked: administrator configuration

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/87
2. Navigate to the merge restriction on the lowest unmerged PR.
3. Select the available bypass option and navigate to its explanation and confirmation.
4. Complete the approved audit merge using an account with the configured bypass role.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** Use layer 1, not the upper PR. The bypass actor and required-review rule are not configured. Apply the S11 setup below first.

### 12. Stack Merge Queue

**Fixture:** S12 | **Readiness:** Blocked: administrator configuration

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/91
2. Navigate to the stack queue action in the merge section and select it.
3. Navigate to the queued status and select its details link.
4. Navigate to the queue entry and the stack's merge-group details.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** The native stack exists but merge queue is not configured. Apply the S12 setup below. Enqueue only this disposable audit stack during execution.

### 13. Stack Auto-merge

**Fixture:** S13 | **Readiness:** Blocked: administrator configuration; availability conditional

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/94
2. Navigate to the controls for selecting the contiguous PR group.
3. Select the available auto-merge action and confirmation controls.
4. Navigate to the enabled status and cancellation control.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** Repository auto-merge remains disabled. Apply the S13 setup below before checking for native stack auto-merge. If the stack-specific control is unavailable after setup, record this scenario as blocked; do not substitute ordinary single-PR auto-merge.

### 14. Partial Merge and Automatic Retargeting

**Fixture:** S14 | **Readiness:** Prepared; merge not executed

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/96
2. Navigate to the bottom PR's merge controls and merge only that approved PR.
3. Open https://github.com/Teamelite12/Pull-Request-Testing/pull/97 and navigate to its updated base branch and stack position.
4. Navigate to the rebase, checks, and merge-status information.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** The separate S14 stack is intact. After merging layer 1, inspect layer 2; do not merge layer 2. Initial destination: `audit/stacked-20261118/partial-base`.

### 15. Branching Stack Retargeting

**Fixture:** S15 | **Readiness:** Prepared; prerequisite merge/deletion not executed

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/102
2. Open https://github.com/Teamelite12/Pull-Request-Testing/pull/99, merge only that parent PR, and delete only `audit/stacked-20261118/s15p/layer-1`.
3. Open https://github.com/Teamelite12/Pull-Request-Testing/pull/102 and navigate to its updated base branch and open state.
4. Navigate to the activity timeline and stack-status information.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** Two real branching native stacks exist. The dependent stack is based on the parent stack's lower branch. Retargeting is triggered by deleting that branch after its merge. Inspect the new destination; it may be the repository default branch. Do not merge the dependent PRs into main.

### 16. Stack Membership Timeline

**Fixture:** S16 | **Readiness:** Prepared: added and removed events exist

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/105
2. Navigate to the activity timeline on the main PR page.
3. Navigate to the added-to-stack and removed-from-stack events.
4. Select the available event links; use the S03 stack for an active membership link.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** Real AddedToStackEvent and RemovedFromStackEvent records were verified on this PR. An active added-to-stack event is also available on https://github.com/Teamelite12/Pull-Request-Testing/pull/73. Do not depend on a Conversation tab; use the PR activity stream if the tab is absent.

### 17. Unstack Pull Requests

**Fixture:** S17 | **Readiness:** Prepared; unstack not executed

1. Open URL: https://github.com/Teamelite12/Pull-Request-Testing/pull/109
2. Navigate to the stack options and select Unstack.
3. Navigate to the confirmation controls and complete the action.
4. Navigate to the remaining PRs and their base branches after stack controls disappear.
5. Verify whether step 2, 3 and 4 are accessible and WCAG compliant or not.

**Remarks:** This dedicated stack is still open, unmerged, and unqueued. Both PRs must remain after unstacking. S16 already provides an example of the post-unstack state.
