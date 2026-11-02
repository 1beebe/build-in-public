# The Interviewer, for your own agent

A weekly interview about your work that remembers. Your agent interviews you about what you built, keeps what you say in a `voice-library` folder of plain Markdown files on your own computer, and starts every later interview from it: what you were in the middle of last time, which stories you've already told. When you want a post, it drafts from months of your own words, never its own.

Nothing is hosted. Your library is files you own, and the only places your words go are the model your agent already uses and, if you connect it, your own Buffer account.

This is the companion to the hosted app at [interviewer.lbeebe.com](https://interviewer.lbeebe.com), which needs nothing installed.

## Install

**Claude Code**

```
/plugin install interviewer --marketplace 1beebe/build-in-public
```

On older versions: `/plugin marketplace add 1beebe/build-in-public`, then `/plugin install interviewer@build-in-public`.

**Claude apps and other agents.** The whole thing is one skill: the [`skills/interviewer`](skills/interviewer) folder. Zip that folder and add it as a skill in your Claude settings, or point any agent that reads Agent Skills at its `SKILL.md`.

## Use

- "Interview me about my week." It reads your recent commits (or asks what you worked on), checks your library, and talks with you one question at a time. Afterwards it saves the transcript and files your stories, positions, open loops, phrases and people.
- "What have I said about pricing?" It answers with your own quotes and dates.
- "Draft a LinkedIn post from the voice-mode story." It builds a draft from your words, tells you which interviews each part came from, and saves it to Buffer as a draft if Buffer is connected.
- "Forget what I said about my old client." It removes it everywhere and tells you what it removed.

Connect Buffer as a tool in your agent if you want drafts to land in Buffer. Without it, drafts are shown ready to copy.
