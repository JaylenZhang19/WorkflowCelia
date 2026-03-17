---
id: task_09_files
name: File Structure Creation
category: file_ops
grading_type: automated
timeout_seconds: 120
workspace_files: []
workspace_dir: workspace
automated_check: automated_check.ts
---

## Prompt

Create a project structure with: src/ directory, src/main.py with hello world, README.md with project title, and .gitignore ignoring **pycache**.

## Expected Behavior

The agent should:

1. Create a directory named `src/`
2. Create a file `src/main.py` with a hello world program
3. Create a file `README.md` with a project title
4. Create a file `.gitignore` that includes `__pycache__`
5. Ensure all files have appropriate content

This tests the agent's ability to perform basic file operations and create a standard project structure.

## Grading Criteria

- [ ] Directory `src/` created
- [ ] File `src/main.py` created
- [ ] `src/main.py` contains valid Python hello world code
- [ ] File `README.md` created
- [ ] `README.md` contains a project title/heading
- [ ] File `.gitignore` created
- [ ] `.gitignore` contains `__pycache__` entry

## Automated Checks

See `automated_check.ts` in this task directory (if present).
