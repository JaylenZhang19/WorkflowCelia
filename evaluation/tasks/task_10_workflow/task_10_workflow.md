---
id: task_10_workflow
name: Multi-step API Workflow
category: complex
grading_type: hybrid
timeout_seconds: 300
workspace_files:
  - path: config.json
workspace_dir: workspace
---

## Prompt

Read config.json, extract the API endpoint, create a Python script to call it, and document the process in NOTES.md.

## Expected Behavior

The agent should:

1. Read the `config.json` file from the workspace
2. Parse the JSON and extract the API endpoint URL
3. Create a Python script that:
   - Reads the config file
   - Makes an HTTP request to the endpoint
   - Handles errors appropriately
   - Prints or returns the response
4. Create a `NOTES.md` file documenting:
   - What was done
   - How the script works
   - How to use it
   - Any important details about the configuration

This tests multi-step coordination, file reading, code generation, and documentation skills.

## Grading Criteria

### Automated Criteria (50%)

- [ ] File `config.json` successfully read
- [ ] Python script file created (any .py name)
- [ ] Script contains valid Python syntax
- [ ] Script reads/parses JSON
- [ ] Script contains HTTP request code
- [ ] File `NOTES.md` created

### LLM Judge Criteria (50%)

- [ ] Script quality and completeness
- [ ] Documentation clarity and usefulness
- [ ] Process explanation quality
- [ ] Overall task completion

## Automated Checks

See `automated_check.ts` in this task directory (if present).

## LLM Judge Rubric

### Criterion 1: Script Quality and Functionality (Weight: 30%)

**Score 1.0**: Python script is well-structured, reads config.json correctly, extracts the endpoint, makes HTTP request with proper error handling, and includes helpful comments. Code follows best practices.

**Score 0.75**: Script is functional with minor issues. Reads config and makes request but may lack comprehensive error handling or have minor code quality issues.

**Score 0.5**: Script has basic functionality but with notable issues. May have incomplete error handling, poor structure, or missing important features.

**Score 0.25**: Script is poorly written or barely functional. Major issues with logic, structure, or error handling.

**Score 0.0**: Script is non-functional, missing, or completely fails to meet requirements.

### Criterion 2: Documentation Quality (Weight: 30%)

**Score 1.0**: NOTES.md is comprehensive, well-organized, and clearly explains what was done, how the script works, and how to use it. Includes relevant details about the config structure and any assumptions made.

**Score 0.75**: Good documentation covering most important points. Minor gaps in explanation or organization.

**Score 0.5**: Basic documentation present but lacking detail or clarity. Missing important information about usage or implementation.

**Score 0.25**: Poor documentation. Minimal information or unclear explanations.

**Score 0.0**: Documentation is missing or completely inadequate.

### Criterion 3: Process Understanding (Weight: 25%)

**Score 1.0**: Clear evidence that agent understood the multi-step workflow. Correctly extracted endpoint from config, created appropriate script, and documented the process logically. Shows good decision-making.

**Score 0.75**: Good understanding with minor issues. Process mostly correct with small gaps in logic or execution.

**Score 0.5**: Partial understanding. Agent completed some steps but missed connections or made questionable decisions.

**Score 0.25**: Poor understanding. Agent struggled with the workflow or made significant errors in process.

**Score 0.0**: No evidence of understanding the task requirements.

### Criterion 4: Overall Completeness (Weight: 15%)

**Score 1.0**: All requirements met. Config read, endpoint extracted, functional script created, comprehensive documentation provided. Task fully complete.

**Score 0.75**: Most requirements met with minor omissions. Task essentially complete.

**Score 0.5**: Some requirements met but significant gaps. Task partially complete.

**Score 0.25**: Few requirements met. Task barely attempted.

**Score 0.0**: Task not completed or completely failed.
