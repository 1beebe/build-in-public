# The library

Plain Markdown files, so the person can read, edit, search and back them up with anything. Every entry points back to the exact sentence it came from.

## Layout

```
voice-library/
  README.md          what this folder is (create it once, from the template below)
  interviews/        one transcript per interview, never edited after the day it's written
    2026-11-02.md
  stories.md         moments with a tension and a turn
  positions.md       what they believe or argue
  open-loops.md      what they're still in the middle of
  phrases.md         wording they keep coming back to
  people.md          people, projects and products they mention
  used.md            which stories became posts, and where
```

## Transcript format (`interviews/YYYY-MM-DD.md`)

```markdown
# Interview, 2026-11-02

Source: 1beebe/build-in-public, 14 commits and 3 merged pull requests this week

**Interviewer:** Last time you were in the middle of deciding whether to charge for voice. Where did that land?

**You:** [1] I decided not to charge yet. [2] Nobody's going to pay for something they haven't tried twice.
```

Number every one of their sentences in square brackets, counting from 1 through the whole interview. Library entries cite them as `2026-11-02 [2]`.

## Filing an interview

Read the whole transcript first. Then add to each file, newest entries at the top. Never paraphrase in the quote: the quote is their exact words, and anything you write is clearly labelled as yours.

**stories.md.** Only moments with a tension (a problem, a doubt, a choice, a surprise) and a turn (what changed, what they decided, what they learned). A topic without both isn't a story. Join sentences from anywhere in the interview that belong together.

```markdown
## Why I'm not charging for voice yet
2026-11-02 [1, 2, 7, 8] · tension: wanting revenue vs. needing repeat users · turn: free until people come back twice
> I decided not to charge yet. Nobody's going to pay for something they haven't tried twice.
> …
```

The title is yours, a few plain words naming the story. Everything after `>` is theirs.

**positions.md.** Things they believe or argue, one per entry, with the quote. If a new position contradicts an older one, keep both and add a line under the new one: `Changed from 2026-10-05: …` in your words.

**open-loops.md.** Unresolved problems, decisions not yet made, bets they're waiting on, things they said they'd try. Write each as a short phrase that completes "you were in the middle of ___", then the quote. When a later interview resolves one, move it to a `## Resolved` section at the bottom with the date and the sentence that resolved it.

**phrases.md.** Wording they've used in two or more interviews, or a line so vivid it's clearly theirs. Quote and dates only. These are for them to notice, never for you to insert.

**people.md.** Names of people, projects, clients and products, one line each with what they are to them and the dates they came up. Skip anyone they asked you not to keep.

**used.md.** Filled in by drafting: which story became which post, on which channel, on what date.

Skip non-answers, filler, anything that only makes sense next to the question, and talk about the session itself (testing this tool, whether the interviewer heard them, their mic), unless that's the story. For people they mention, never guess gender: use their words or "they". Fewer, fuller entries beat many thin ones.

## README template

```markdown
# Voice library

What I've said in interviews with The Interviewer, kept on my own computer.
`interviews/` holds the full transcripts. The other files collect my stories,
positions, open loops, phrases, people, and what I've already posted, each
pointing back to the sentence it came from.

To forget something, ask the agent to remove it, or delete it by hand.
```
