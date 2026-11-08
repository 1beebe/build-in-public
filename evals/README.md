# Evals

A small, repeatable check we run before every prompt deploy. It takes about 5 minutes and costs about $0.50 in model calls.

- **Conversation evals.** Six scripted personas (`personas.json`) talk to the live typed interviewer: the builder, the terse one, the rambler, the finisher, the writer (long-form) and the dead end ("not sure", "there might be more in the repo").
- **Simulated personas.** `sim-talker` and `sim-terse` are played by a model from a hidden, invented backstory (owner-only `/api/eval/answer`). They only tell a story when a question points at it, so a better interviewer gets more out of them. Score: how many of the hidden stories came out, how many words they said, and how many drafts you'd post after light edits.
- **Harvest evals.** Fixed transcripts go through the harvester. Because the input never changes, any change in the drafts comes from the prompts. The transcripts are real interviews, so they're kept privately in the project folder (`evals/fixtures/`), not in this public repo. Each fixture holds the transcript, the setup, and the drafts the harvester produced at the time (the baseline).

## Running it

1. `runner.js` runs in the owner's signed-in tab on the live app. It defines `window.__evalStart({ personas, fixtures })` and writes progress and results to `window.__eval`. It runs every persona with "keep transcript" and memory turned off, never saves to Buffer, and at the end restores the setup it found and clears the session. `window.__evalStart({ personas, prompt: 1 })` runs the older v1 prompt for comparison (owner-only); the default is v2. The owner's hourly and daily caps are four times the usual ones, which leaves room for a run.
2. Save `window.__eval` as `results/<date>-<commit>.json` in the project folder.
3. `node evals/score.mjs results.json fixtures/ <commit>` prints the scorecard with the code checks filled in.
4. Score the judged checks with `RUBRIC.md`, add "what changed since last run", and save the scorecard beside the results.

Voice is covered by the scripted voice test in `voice/` (a synthetic voice fed in as the mic) and by ear.
