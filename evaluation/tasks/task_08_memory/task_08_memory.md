---
id: task_08_memory
name: Memory Retrieval from Context
category: context
grading_type: automated
timeout_seconds: 120
workspace_dir: workspace
workspace_files:
  - path: "notes.md"
automated_check: "automated_check.ts"
---

## Prompt

Read the project notes in `notes.md` and answer: What is the deadline for the beta release?

Save your answer to `answer.txt`.

## Expected Behavior

The agent should:

1. Read the file `notes.md` from the workspace
2. Parse the content to find information about the beta release deadline
3. Extract the correct date: June 1, 2024
4. Create a file named `answer.txt` with the answer
5. Format the answer clearly

This tests the agent's ability to retrieve specific information from context files.

## Grading Criteria

- [ ] File `answer.txt` created
- [ ] Answer contains the date "June 1, 2024" or equivalent
- [ ] Answer is clear and directly addresses the question
- [ ] Agent read the notes.md file (visible in transcript)
- [ ] No hallucinated or incorrect information

## Automated Checks

See `automated_check.ts` in this task directory.
