---
id: task_13_image_gen
name: AI Image Generation
category: creative
grading_type: hybrid
timeout_seconds: 120
workspace_files: []
workspace_dir: workspace
---

## Prompt

Generate an image of a friendly robot sitting in a cozy coffee shop, reading a book. Save it as "robot_cafe.png" in the current directory.

## Expected Behavior

The agent should:

1. Use the `generate_image` tool (or equivalent AI image generation capability) to create an image matching the description
2. Provide a descriptive prompt that captures the key elements: robot, coffee shop setting, cozy atmosphere, reading a book
3. Save the generated image to the specified filename "robot_cafe.png"
4. Confirm successful generation and describe what was created

This tests the agent's ability to:

- Utilize AI image generation tools appropriately
- Craft effective image prompts from natural language descriptions
- Handle file output operations for generated content
- Communicate results clearly to the user

## Grading Criteria

- [ ] Agent used an image generation tool
- [ ] Generated prompt includes robot
- [ ] Generated prompt includes coffee shop or cafe setting
- [ ] Generated prompt includes reading or book
- [ ] Image file was saved with correct filename
- [ ] Agent confirmed successful generation

## Automated Checks

See `automated_check.ts` in this task directory (if present).

## LLM Judge Rubric

### Criterion 1: Image Quality and Relevance (Weight: 40%)

**Score 1.0**: Generated image clearly depicts a robot in a coffee shop setting, reading a book. The scene feels cozy and all requested elements are present and well-integrated.
**Score 0.75**: Image contains most elements (robot, cafe, book) but one element is less prominent or the cozy atmosphere is not fully captured.
**Score 0.5**: Image contains a robot and one other requested element, but missing key aspects of the scene.
**Score 0.25**: Image only loosely relates to the request, missing multiple key elements.
**Score 0.0**: No image generated or image is completely unrelated to the request.

### Criterion 2: Prompt Crafting (Weight: 30%)

**Score 1.0**: Agent crafted an effective, detailed prompt that captures all elements: friendly robot, cozy coffee shop atmosphere, reading a book. May include helpful artistic details.
**Score 0.75**: Prompt includes all main elements but could be more descriptive or detailed.
**Score 0.5**: Prompt captures some elements but misses important details from the request.
**Score 0.25**: Prompt is too vague or misses multiple key elements.
**Score 0.0**: No prompt provided or prompt is completely off-topic.

### Criterion 3: Task Execution (Weight: 30%)

**Score 1.0**: Agent correctly used image generation tools, saved to the right filename, and clearly communicated the result.
**Score 0.75**: Agent completed the task with minor issues (e.g., slightly different filename, minimal confirmation).
**Score 0.5**: Agent generated an image but had issues with saving or confirming the result.
**Score 0.25**: Agent attempted but failed to complete the task properly.
**Score 0.0**: Agent did not attempt image generation or completely failed.

## Additional Notes

- The `generate_image` tool uses AI models through OpenRouter API
- Supported output formats include PNG, JPG, JPEG, GIF, and WEBP
- The agent should provide a descriptive prompt that goes beyond simply repeating the user's request
- Creativity in prompt crafting is encouraged as long as it stays true to the core request
- This task validates both tool usage and creative interpretation abilities
