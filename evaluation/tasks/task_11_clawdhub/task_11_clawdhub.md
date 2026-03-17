---
id: task_11_clawdhub
name: Create Project Structure
category: file_ops
grading_type: automated
timeout_seconds: 120
workspace_files: []
workspace_dir: workspace
---

## Prompt

Create a basic Python project structure for a library called "datautils". The project should include:

1. A `src/datautils/` package directory with an `__init__.py` file
2. A `tests/` directory with a `test_datautils.py` file
3. A `pyproject.toml` file with basic project metadata (name, version 0.1.0, description)
4. A `README.md` file with a title and brief description

Please create this project structure in the current workspace.

## Expected Behavior

The agent should:

1. Create the directory structure: `src/datautils/`, `tests/`
2. Create `src/datautils/__init__.py` with basic content
3. Create `tests/test_datautils.py` with a placeholder test
4. Create `pyproject.toml` with proper Python project metadata
5. Create `README.md` with project documentation

This tests the agent's ability to create file structures and understand Python project conventions.

## Grading Criteria

- [ ] Agent created the `src/datautils/` directory structure
- [ ] Agent created `__init__.py` in the package
- [ ] Agent created `tests/` directory with test file
- [ ] Agent created `pyproject.toml` with correct metadata
- [ ] Agent created `README.md`
- [ ] Agent confirmed successful creation

## Automated Checks

See `automated_check.ts` in this task directory (if present).

## Additional Notes

- This tests the agent's ability to create a proper Python project structure
- The agent should understand Python packaging conventions
- Files should have meaningful content, not just be empty placeholders
- This is a common real-world task for starting new projects
