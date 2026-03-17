---
id: task_05_summary
name: Document Summarization
category: comprehension
grading_type: llm_judge
timeout_seconds: 240
workspace_files:
  - path: summary_source.txt
workspace_dir: workspace
---

## Prompt

Read the document in summary_source.txt and write a concise 3-paragraph summary to summary_output.txt.

## Expected Behavior

The agent should:

1. Read the content from `summary_source.txt` (provided in workspace)
2. Comprehend the main points and key themes
3. Write a concise 3-paragraph summary that captures:
   - Main topic and overview (paragraph 1)
   - Key applications and benefits (paragraph 2)
   - Challenges and future outlook (paragraph 3)
4. Save the summary to `summary_output.txt`
5. Maintain accuracy while being concise

The summary should be significantly shorter than the original while preserving the essential information.

## Grading Criteria

- [ ] File `summary_output.txt` created
- [ ] Summary has exactly 3 paragraphs
- [ ] Summary accurately captures main topic (AI in healthcare)
- [ ] Summary mentions key applications (imaging, drug discovery, predictive analytics)
- [ ] Summary addresses challenges (privacy, bias, regulation)
- [ ] Summary is concise (significantly shorter than original)
- [ ] Writing is clear and coherent
- [ ] No significant factual errors or misrepresentations

## LLM Judge Rubric

### Criterion 1: Accuracy and Completeness (Weight: 35%)

**Score 1.0**: Summary accurately captures all major themes: AI applications in healthcare (imaging, drug discovery, predictive analytics), benefits, challenges (privacy, bias, regulation), and future outlook. No factual errors or misrepresentations.

**Score 0.75**: Summary captures most major themes with minor omissions. One key area may be underrepresented. No significant factual errors.

**Score 0.5**: Summary captures some major themes but misses important aspects. May have minor factual inaccuracies or overemphasis on less important points.

**Score 0.25**: Summary misses multiple major themes or contains significant factual errors. Poor representation of the source material.

**Score 0.0**: Summary is completely inaccurate, off-topic, or missing.

### Criterion 2: Conciseness (Weight: 25%)

**Score 1.0**: Summary is appropriately concise (150-250 words), capturing essential information without unnecessary detail. Excellent information density.

**Score 0.75**: Summary is reasonably concise (250-350 words) with good information density. Minor verbosity.

**Score 0.5**: Summary is somewhat verbose (350-450 words) or too brief (under 100 words), missing the balance between conciseness and completeness.

**Score 0.25**: Summary is excessively long (over 450 words) or far too brief (under 75 words) to be useful.

**Score 0.0**: Summary length is completely inappropriate or content is missing.

### Criterion 3: Structure and Coherence (Weight: 20%)

**Score 1.0**: Exactly 3 well-organized paragraphs with clear logical flow. First paragraph introduces topic, second covers applications/benefits, third addresses challenges/future. Excellent transitions and coherence.

**Score 0.75**: 3 paragraphs with good organization. Minor issues with flow or paragraph focus. Generally coherent.

**Score 0.5**: 3 paragraphs but with organizational issues, or wrong number of paragraphs (2 or 4) but otherwise well-structured. Some coherence problems.

**Score 0.25**: Poor structure with significant coherence issues. May have wrong number of paragraphs and disorganized content.

**Score 0.0**: No discernible structure or content is missing.

### Criterion 4: Writing Quality (Weight: 15%)

**Score 1.0**: Excellent writing with clear, professional prose. No grammar or spelling errors. Appropriate vocabulary and tone.

**Score 0.75**: Good writing quality with minor issues. Few grammar errors. Generally clear and professional.

**Score 0.5**: Adequate writing but with notable grammar issues, awkward phrasing, or clarity problems.

**Score 0.25**: Poor writing quality with multiple errors or unclear expression.

**Score 0.0**: Writing is incomprehensible or missing.

### Criterion 5: Task Completion (Weight: 5%)

**Score 1.0**: File created with correct name (summary_output.txt), agent read the source file, all requirements met.

**Score 0.75**: File created with minor issues (e.g., slight naming variation) but task essentially complete.

**Score 0.5**: File created but with significant issues or missing requirements.

**Score 0.25**: File created but content is severely lacking or incorrect.

**Score 0.0**: No file created or file is empty.
