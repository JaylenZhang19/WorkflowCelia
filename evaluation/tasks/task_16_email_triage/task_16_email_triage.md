---
id: task_16_email_triage
name: Email Inbox Triage
category: organization
grading_type: hybrid
timeout_seconds: 240
grading_weights:
  automated: 0.4
  llm_judge: 0.6
workspace_files:
  - path: inbox/email_01.txt
  - path: inbox/email_02.txt
  - path: inbox/email_03.txt
  - path: inbox/email_04.txt
  - path: inbox/email_05.txt
  - path: inbox/email_06.txt
  - path: inbox/email_07.txt
  - path: inbox/email_08.txt
  - path: inbox/email_09.txt
  - path: inbox/email_10.txt
  - path: inbox/email_11.txt
  - path: inbox/email_12.txt
  - path: inbox/email_13.txt
workspace_dir: workspace
automated_check: automated_check.ts
---

## Prompt

You are helping triage an overflowing email inbox. The emails have been provided to you in the `inbox/` folder in your workspace (files named `email_01.txt` through `email_13.txt`). Read all 13 emails and create a triage report saved to `triage_report.md`. For each email, assign:

1. **Priority**: P0 (drop everything), P1 (today), P2 (this week), P3 (when convenient), P4 (no action / archive)
2. **Category**: one of "incident", "client", "internal-request", "administrative", "code-review", "automated", "newsletter", "spam"
3. **Recommended action**: a brief (1-2 sentence) description of what to do

Organize the report with emails sorted by priority (most urgent first). Include a brief summary section at the top that highlights the most critical items and suggests a plan for the day.

## Expected Behavior

The agent should:

1. Discover and read all 13 email files in the `inbox/` directory
2. Analyze each email for urgency, sender importance, deadlines, and content
3. Assign appropriate priority levels considering:
   - Production incidents are P0
   - High-value client communications are P1
   - Security compliance deadlines are P1-P2
   - Peer code reviews with deadlines are P2
   - Administrative tasks with deadlines are P2
   - Newsletters and social notifications are P3-P4
   - Spam/promotional emails are P4
4. Categorize each email correctly
5. Provide actionable, specific recommendations for each email
6. Create a structured, scannable report sorted by priority
7. Include a top-level summary with a suggested day plan
8. Save the report to `triage_report.md`

This tests the agent's ability to:

- Process a batch of heterogeneous inputs
- Apply judgment to classify and prioritize information
- Recognize contextual clues (e.g., the monitoring alert relates to the database outage)
- Distinguish between urgent, important, and low-value items
- Produce structured, actionable output

## Grading Criteria

- [ ] Agent discovered and read all 13 emails in inbox/
- [ ] File `triage_report.md` created
- [ ] All 13 emails are present in the report
- [ ] Each email has a priority assigned (P0-P4)
- [ ] Each email has a category assigned
- [ ] Each email has a recommended action
- [ ] Production outage email (01) is classified as P0
- [ ] Monitoring alert (13) is linked to or grouped with the outage
- [ ] Client email (05) is classified as high priority (P0 or P1)
- [ ] Spam/promotional email (11) is classified as P4
- [ ] Report is sorted by priority (most urgent first)
- [ ] Summary section exists at the top of the report

## Automated Checks

See `automated_check.ts` in this task directory (if present).

## LLM Judge Rubric

### Criterion 1: Priority Assignment Accuracy (Weight: 30%)

**Score 1.0**: All priorities are correctly assigned. Production outage (email 01) and correlated monitoring alert (email 13) are P0. BigClient follow-up (email 05) is P0 or P1. Security password rotation (email 08) is P1 or P2 given its 2-day deadline. Auth service code review (email 10) is P2 given it blocks a release. Budget reconciliation (email 12) is P2. Performance review (email 07) and blog review (email 02) are P2-P3. Benefits reminder (email 04) is P2-P3. Dependabot PR (email 03) is P3. LinkedIn (email 06), newsletter (email 09), and promotional spam (email 11) are P3-P4. No significant misranking.

**Score 0.75**: Most priorities are reasonable with 1-2 minor misrankings (e.g., code review rated too low or too high). All critical items (outage, client, security) correctly identified as high priority.

**Score 0.5**: Several questionable priority assignments. May miss the urgency of the client email or security deadline. Gets the obvious ones right (outage = P0, spam = P4) but struggles with the middle priorities.

**Score 0.25**: Significant misrankings. May fail to recognize the production outage as top priority, or rank low-value items too high. Priority scheme seems arbitrary.

**Score 0.0**: No priorities assigned, or priorities are completely wrong (e.g., spam ranked higher than production incident).

### Criterion 2: Categorization Quality (Weight: 15%)

**Score 1.0**: All emails correctly categorized. Recognizes: incident (emails 01, 13), client (email 05), internal-request (emails 02, 07, 08, 10, 12), automated (email 03), newsletter (email 09), spam (email 11), administrative (emails 04, 07). Categories are consistent and meaningful.

**Score 0.75**: Most categories correct with 1-2 minor miscategorizations. Categories are from a reasonable taxonomy.

**Score 0.5**: Some categories correct but several emails miscategorized. May use inconsistent or overly broad categories.

**Score 0.25**: Poor categorization. Many emails miscategorized or categories are not meaningful.

**Score 0.0**: No categories assigned or completely wrong.

### Criterion 3: Action Recommendations (Weight: 25%)

**Score 1.0**: Recommendations are specific, actionable, and appropriate. Examples: "Join war room call immediately" for outage; "Reply to Mike Chen proposing Tuesday/Thursday times, loop in account manager, gather SOC 2 docs" for client email; "Archive/delete" for spam; "Review PR #156 by Wednesday, focus on PKCE flow changes" for code review. Recommendations show understanding of context (e.g., alert correlates with outage, code review blocks mobile release).

**Score 0.75**: Most recommendations are good and actionable. Minor issues like being too vague on 1-2 items or missing context connections.

**Score 0.5**: Recommendations exist but are generic ("respond to this email") rather than specific. Missing key context like the $2M contract value or the release-blocking nature of the code review.

**Score 0.25**: Recommendations are too vague to be useful or inappropriate for several emails.

**Score 0.0**: No recommendations provided or completely unhelpful.

### Criterion 4: Contextual Awareness and Connections (Weight: 15%)

**Score 1.0**: Demonstrates strong contextual reasoning. Explicitly connects the monitoring alert (email 13) to the production outage (email 01). Recognizes the $2M value of the BigClient relationship. Notes that the auth code review blocks a mobile release. Understands the security deadline is only 2 days away. May note that the outage could affect the BigClient relationship.

**Score 0.75**: Makes most key connections. Links alert to outage. Recognizes most time-sensitive items and their implications.

**Score 0.5**: Makes 1-2 connections but misses others. Treats each email in isolation without seeing relationships.

**Score 0.25**: Minimal contextual awareness. Processes each email independently with no cross-referencing.

**Score 0.0**: No contextual connections made.

### Criterion 5: Report Structure and Usability (Weight: 15%)

**Score 1.0**: Report is well-structured and immediately actionable. Has a clear summary/day-plan at the top. Emails organized by priority. Uses consistent formatting (headers, bullet points, tables). Easy to scan quickly. A busy person could glance at this and know exactly what to do first.

**Score 0.75**: Good structure with minor formatting issues. Summary present. Generally easy to scan.

**Score 0.5**: Basic structure but could be better organized. May lack summary or use inconsistent formatting. Requires more effort to extract key information.

**Score 0.25**: Poor structure. Hard to scan. No clear organization or summary.

**Score 0.0**: Unstructured or incomprehensible output.

## Additional Notes

This task tests a practical, everyday AI assistant scenario: processing a backlog of mixed-priority emails and producing an actionable triage plan. Key challenges include:

1. **Volume processing**: The agent must handle 13 diverse emails without losing track of any
2. **Judgment calls**: Priority assignment requires nuanced reasoning about urgency, importance, and deadlines
3. **Context linking**: The monitoring alert (email 13) explicitly mentions correlation with the database incident - a good agent should connect these
4. **Stakeholder awareness**: Recognizing that a $2M client email and CTO escalation carry different weight than a newsletter
5. **Actionability**: Recommendations should be specific enough to actually act on, not generic platitudes

The email set intentionally includes:

- A clear P0 incident with a correlated alert (tests linking)
- A high-value client communication (tests business judgment)
- Time-sensitive compliance items (tests deadline awareness)
- Peer requests with downstream dependencies (tests impact assessment)
- Low-value noise: newsletters, social notifications, spam (tests filtering)
- Administrative items with varying deadlines (tests prioritization granularity)
