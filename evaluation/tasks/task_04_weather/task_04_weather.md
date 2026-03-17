---
id: task_04_weather
name: Weather Script Creation
category: coding
grading_type: automated
timeout_seconds: 180
workspace_files: []
workspace_dir: workspace
---

## Prompt

Create a Python script called weather.py that fetches weather data for San Francisco using the wttr.in API and prints a summary.

## Expected Behavior

The agent should:

1. Create a file named `weather.py`
2. Write Python code that makes an HTTP request to wttr.in
3. Parse the response to extract weather information
4. Print a readable summary of the weather
5. Include basic error handling for network issues
6. Use standard library or common libraries (requests, urllib)

The wttr.in API can be accessed at `https://wttr.in/San_Francisco?format=j1` for JSON data or `https://wttr.in/San_Francisco?format=3` for simple text format.

## Grading Criteria

- [ ] File `weather.py` created
- [ ] File contains valid Python syntax
- [ ] Code includes HTTP request to wttr.in or similar weather API
- [ ] Code references San Francisco location
- [ ] Code includes error handling (try/except or similar)
- [ ] Code prints or outputs weather information
- [ ] Script is executable (has proper structure)

## Automated Checks

See `automated_check.ts` in this task directory (if present).
