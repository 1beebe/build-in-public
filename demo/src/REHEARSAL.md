# Rehearsal: The Interviewer

Gold: `phone-touch` (one phone, a flow that returns to its opening, touch cursor). The answer streams with `Stream`. The tally uses `Count`.

The screens are the app's own dark-mode UI from `src/pages.ts`, at a phone width. Heroes are the real words and controls: the setup heading and steps, the note field, the channel chips (LinkedIn checked in the dark-mode mint with the check), Start the interview, the orb with Your interview, the question and the answer bubble, Pause, I'm done. Find my stories, the waiting ripple from `shimmer` (the pearl code thread, not a green matrix), Finding your stories with one "You said" line, the dealt draft cards (channel and Draft), Your drafts are in Buffer, the 128 / 3 tally, and Open my drafts in Buffer.

The card entrance and the button sheen are the app's own, copied from `src/pages.ts`:

- `deal`, `rim`, and `edgerun` in `APP_STYLE` (the `#done` deck). `renderDone` adds `dealt` when `deal` ends, and `layDeck` adds `glint` on the front card.
- `sheen` in `STYLE` (`.btn.sheen` / `.chip.sheen`). `FEEDBACK_SCRIPT` adds that class on a press. The demo does the same when a control receives `data-pressed`, including the tap on I'm done. Find my stories.

Beats: paste `github.com/1beebe/build-in-public`, select LinkedIn, tap Start, the question, the answer streams, the wait quotes that sentence, the cards deal and the tally rolls. The file ends on the settled done screen. The component still loops. Poster is the done screen.

Captured:

- Wide loop, `film.mjs --gate` → `rehearsal passed`
- Same stage at `--width 390`, `--gate` → `rehearsal passed`
- Square stage (`?shape=square`) reduced-motion poster, `--still --gate` → `rehearsal passed`
- Real app markup from `src/pages.ts`, dark, 390px wide, set beside the demo frames (setup, talk, wait, done)

Film:

- The Start button was below the crop once the keep-checkboxes were in → those two lines are left off so the button stays whole
- The type-your-answer composer is left off the portrait frame for the same reason; I'm done. Find my stories stays in
- The square crop keeps I'm done. Find my stories by dropping the "The Interviewer" / "You" labels and tightening the talk card
- The waiting card is a fixed height inside the crop. The thread is the app's `shimmer` draw (cool / hot / iris from the dark tokens), started a few seconds in so the wave is already across the card
- Side cards use the same sentence, tucked inside the front card so only a card edge shows
- `Count` still rolls 0 to 128 inside a fixed slot. Settled frames show 128 and 3

Review: setup shows the heading, the three sentences, the repo, four chips with LinkedIn on, and Start. Talk shows the orb, Listening, the question, the answer, Pause (the live button, off-white with the yellow stop), and I'm done. Wait shows Finding your stories over the pearl thread and the You said line. Done shows the LinkedIn card, the tally, and Open my drafts in Buffer.

Assumptions:

- interviewer.lbeebe.com/app redirects without a Buffer session, so the real side of the comparison is `appPage()` rendered from `src/pages.ts` in dark mode at 390px, with this story's sentence filled in
- 128 and 3 are the interview tally, not a count of the one sentence
- The orb's pulse stands in for a microphone level. The colors and the listening dot are the app's

Remaining differences from the real phone screen:

- The two keep checkboxes and the type-your-answer composer sit under the phone crop, so they are not drawn
- The setup steps are one paragraph, not a bulleted list, so three wrapped rows do not fail the film check and the Start button stays in frame
- The note field is shorter than the app's 120px textarea
- The square talk card drops the "The Interviewer" and "You" labels so I'm done. Find my stories stays whole
- Side cards sit closer than the app's 20% fan, so their words stay behind the front card
- The plugin and GitHub footer are off this frame. "See you next week" is on the portrait done screen
- Voice status is under the title as well as on the orb. In the app that word sits in the live box

Not checked:

- Playback inside LinkedIn or X
- A full motion gate of the square stage (the square poster gate passed)
- Every frame of the encoded MP4. The files are trimmed to end on the settled done screen
