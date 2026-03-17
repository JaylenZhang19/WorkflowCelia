---
id: task_17_email_search
name: Email Search and Summarization
category: comprehension
grading_type: hybrid
timeout_seconds: 240
grading_weights:
  automated: 0.4
  llm_judge: 0.6
workspace_files:
  - path: emails/2026-01-15_project_alpha_kickoff.txt
  - path: emails/2026-01-22_alpha_data_pipeline.txt
  - path: emails/2026-02-03_alpha_budget_concern.txt
  - path: emails/2026-02-05_alpha_api_design.txt
  - path: emails/2026-02-10_alpha_security_review.txt
  - path: emails/2026-02-12_alpha_phase1_complete.txt
  - path: emails/2026-02-14_alpha_client_feedback.txt
  - path: emails/2026-02-18_alpha_timeline_slip.txt
  - path: emails/2026-02-20_unrelated_team_lunch.txt
  - path: emails/2026-02-22_unrelated_conference.txt
  - path: emails/2026-02-25_alpha_frontend_progress.txt
workspace_dir: workspace
automated_check: automated_check.ts
---

## Prompt

You have access to a collection of emails in the `emails/` folder in your workspace (12 email files with dates in their filenames). Search through all the emails to find everything related to "Project Alpha" and create a comprehensive summary document.

Save the summary to alpha_summary.md with the following sections:

1. **Project Overview**: What is Project Alpha, what technology is being used, and what is the budget?
2. **Timeline**: Original timeline and any changes, including current expected dates
3. **Key Risks and Issues**: Budget concerns, security findings, technical challenges
4. **Client/Business Impact**: Sales pipeline, client feedback, and revenue projections
5. **Current Status**: Where the project stands right now based on the most recent updates

## Expected Behavior

The agent should:

1. Discover and read all email files in the `emails/` directory
2. Identify which emails are related to Project Alpha (10 of 12 are relevant; 2 are unrelated noise)
3. Filter out unrelated emails (team lunch, conference promo)
4. Synthesize information across multiple emails into a coherent narrative
5. Track how information evolved over time (e.g., budget went from $340K to $410K, timeline slipped)
6. Cross-reference details (e.g., security findings led to timeline changes, client feedback informed prioritization)
7. Produce a well-structured summary document saved to `alpha_summary.md`

This tests the agent's ability to:

- Search through and filter a collection of documents
- Distinguish relevant from irrelevant content
- Synthesize information from multiple sources
- Track evolving facts across a timeline
- Produce structured, accurate summaries

## Grading Criteria

- [ ] Agent discovered and read emails from the emails/ directory
- [ ] File `alpha_summary.md` created
- [ ] Summary correctly identifies Project Alpha as an analytics dashboard
- [ ] Technology stack mentioned (PostgreSQL/TimescaleDB, FastAPI, React, Kafka, etc.)
- [ ] Original budget ($340K) and revised budget ($410K) both mentioned
- [ ] Original timeline and updated timeline both captured
- [ ] Security review findings summarized
- [ ] Client feedback and revenue pipeline captured ($1.85M-$2.8M ARR)
- [ ] Unrelated emails (team lunch, conference) excluded from the summary
- [ ] Current project status accurately reflects latest updates
- [ ] Information synthesized across emails, not just listed per-email

## Automated Checks

See `automated_check.ts` in this task directory (if present).

## LLM Judge Rubric

### Criterion 1: Information Completeness (Weight: 25%)

**Score 1.0**: Summary captures all major aspects of Project Alpha from all 10 relevant emails: project definition, tech stack, budget (original and revised), timeline (original and revised), data pipeline architecture, API design, security findings, Phase 1 completion, client feedback with specific prospects, and frontend progress. No significant information gaps.

**Score 0.75**: Summary captures most major aspects with 1-2 minor omissions. May miss details like specific client names or exact budget numbers but gets the overall picture right.

**Score 0.5**: Summary captures the main narrative but misses several important details. May cover only 6-7 of the 10 relevant emails' content. Gets the basics right but lacks depth.

**Score 0.25**: Summary is superficial, covering only 3-4 emails' worth of content. Missing major developments like the security review or client feedback.

**Score 0.0**: Summary is missing, empty, or fails to capture the project narrative.

### Criterion 2: Information Synthesis Quality (Weight: 25%)

**Score 1.0**: Summary synthesizes information across emails into a coherent narrative rather than just listing email-by-email summaries. Connects related facts: security findings caused timeline slip, budget evolved from $340K to $410K through a specific negotiation process, client feedback is feeding back into feature prioritization, early frontend work is mitigating timeline delay. Tracks how facts evolved over time.

**Score 0.75**: Good synthesis with most cross-email connections made. May present some information chronologically per-email rather than thematically, but demonstrates understanding of how events relate.

**Score 0.5**: Partial synthesis. Some connections made but largely reads as a chronological list of email summaries. Misses key relationships between events.

**Score 0.25**: Minimal synthesis. Essentially a list of individual email summaries with little connection between them.

**Score 0.0**: No synthesis. Either missing or just raw content dumps.

### Criterion 3: Noise Filtering and Relevance (Weight: 15%)

**Score 1.0**: Correctly identifies and excludes the 2 unrelated emails (team lunch, conference promo) while including all 10 Project Alpha emails. No irrelevant content appears in the summary. Demonstrates clear understanding of what's relevant.

**Score 0.75**: Mostly correct filtering. May include a very brief mention of an unrelated email or miss one peripheral Alpha detail, but the summary is clearly focused on Project Alpha.

**Score 0.5**: Includes some irrelevant content from non-Alpha emails, or misses 1-2 relevant Alpha emails. Filtering judgment is inconsistent.

**Score 0.25**: Poor filtering. Includes significant irrelevant content or misses multiple relevant emails.

**Score 0.0**: No filtering applied - all emails treated equally, or only irrelevant content included.

### Criterion 4: Structure and Readability (Weight: 20%)

**Score 1.0**: Summary follows the requested 5-section structure (Overview, Timeline, Risks/Issues, Client/Business Impact, Current Status). Each section is focused and well-organized. Easy to scan. Uses appropriate formatting (headers, bullet points, etc.). A stakeholder could read this and quickly understand the full project status.

**Score 0.75**: Good structure following the requested format with minor organizational issues. Generally easy to read and scan.

**Score 0.5**: Basic structure present but sections may be disorganized, overlapping, or not following the requested format. Requires more effort to extract key information.

**Score 0.25**: Poor structure. Sections are unclear or missing. Hard to navigate the document.

**Score 0.0**: No discernible structure or document is missing.

### Criterion 5: Accuracy (Weight: 15%)

**Score 1.0**: All facts, figures, and dates are accurately represented. Budget numbers, timeline dates, client names, ARR figures, technology choices, and security findings all match the source emails. No fabricated information.

**Score 0.75**: Almost all facts are accurate with 1-2 minor errors (e.g., slightly wrong date, approximate figure). No major fabrications.

**Score 0.5**: Several factual errors or imprecise representations. May confuse details between emails or present approximate information where exact figures were available.

**Score 0.25**: Significant factual errors that misrepresent the project status. May include fabricated details not in the source emails.

**Score 0.0**: Pervasive inaccuracies or fabricated content.

## Additional Notes

This task tests a practical knowledge-worker scenario: searching through a collection of project-related emails and producing an executive summary. Key challenges include:

1. **Search and filtering**: The agent must identify which emails are relevant to the query and exclude noise (2 of 12 emails are unrelated)
2. **Temporal tracking**: Information evolves across emails - the budget changes, timeline slips, and project status progresses. The agent must track these changes rather than treating each email in isolation
3. **Cross-referencing**: Multiple emails reference the same topics (e.g., security findings appear in the security review email AND the timeline update email). A good summary connects these
4. **Synthesis vs. summarization**: The task asks for a thematic summary organized by topic, not a chronological list of emails. This requires reorganizing information from its source structure
5. **Specificity**: The source emails contain precise figures ($340K, $410K, $2.8M ARR, etc.) and dates. A good summary preserves this precision rather than generalizing

The email set is designed to tell a coherent project story with realistic complexity: an approved project hits infrastructure cost overruns, undergoes security review that causes timeline changes, receives positive client feedback, and adapts its plan accordingly.
