# Rehearsal: The Interviewer

Gold: `phone-touch` (one phone, a flow that returns to its opening, touch cursor, measured targets). The answer streams the way `ai-chat` does (`Stream`, words laid out before they appear). The tally uses `Count`, the way a figure resolves in `loading`.

Beats: setup (paste a repo, select LinkedIn, tap Start) → talk (question, pulsing orb, answer streams) → shimmer with that sentence quoted → cards deal in and the tally rolls → payoff holds on "Your drafts are in Buffer." Loop about 14s, back to the empty setup while the done screen has faded. Poster is the settled done screen.

Captured:

- Wide loop at design width 540 (filmed at 2x, 1080×1350), `film.mjs --gate` → `rehearsal passed`
- Same stage at `--width 390` (compact), `--gate` → `rehearsal passed`
- Square stage (`?shape=square`, 540×540, 1080×1080 still), `--still --gate` → `rehearsal passed`, no issues on the poster
- Reduced motion (`--reduced --still`) on portrait and square: the poster, cards landed, 128 and 3 settled
- Dark theme is the only look (`theme="dark"` plus the app's dark tokens)

Film:

- Hero draft clipped by the card → the card grew and dropped the bar above the sentence → the full sentence is visible on the poster and at 11.5s of the 4:5 video
- Finger covered the pasted URL → the tap sits in the empty right of the field → 1.5s shows the URL clear, the finger beside it
- Button label measured short of its glyphs → line-height 1.25 → "Start the interview" reads whole, including the p
- Compact tally labels rendered at 9.1px → 15px → the 390 gate no longer reports small text
- Bars on the fanned cards collided → only the front card has words; the other two are card shapes
- `Count` reports a horizontal jump as 0 becomes 128, then a settle on its digit strip. Settled frames (9.6s, 11.5s, the poster) show 128 and 3 still and centered. The strip's internal homing is the kit's, and the figures on screen do not hop between those frames
- An earlier pass called the wait "near-empty" because the thread is a canvas. The frames show the thread and the quoted sentence. The last portrait gate did not repeat that line

Review: looked at the contact sheet and at 0, 1.5, 4, 6.5, 9, 11.5 and 13.2 of the 4:5 video, plus the square poster and the square video at 11s. A second pass of the encoded file confirmed the sentences are whole and the tally settles on 128 and 3. The file as first encoded ran a fraction of a second into the loop reset and cut back to setup. Both MP4s are trimmed to 12.88s so they end on the settled done screen. The component still loops. The finger sits in the empty right of the field; on the button it meets the end of "interview" only for the press itself. No sparkle, no purple, no invented logo (the mark is the app's yellow bubble).

Assumptions:

- The pasted repo is this project's public URL
- The sentence is one a person would say about the dark-mode chip work; the hero draft and the shimmer quote are that sentence, not a rewrite
- 128 and 3 are the interview's tally, not a count of the one sentence on screen
- Filler bars stand in for the setup steps, the other channels, and the other drafts

Unresolved: none that change the picture.

Not checked:

- Playback inside LinkedIn or X, or on a physical phone
- A full motion `--gate` of the square stage (the square poster gate passed, and the square video's payoff frame matches it)
- Every frame of the encoded MP4 (ffmpeg packed a ~30fps screencast down to 25fps, dropping some frames). Sampled frames above, not a frame-by-frame pass of the file
- Pause, replay, and reduced-motion toggled live in a browser beyond `film.mjs --reduced`
