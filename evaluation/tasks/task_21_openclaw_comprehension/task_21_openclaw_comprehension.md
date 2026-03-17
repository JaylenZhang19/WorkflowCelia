---
id: task_21_openclaw_comprehension
name: OpenClaw Report Comprehension
category: comprehension
grading_type: automated
timeout_seconds: 300
workspace_files:
  - path: openclaw_report.pdf
workspace_dir: workspace
---

## Prompt

I have a research report about OpenClaw agent use cases in my workspace as `openclaw_report.pdf`. I need you to extract several pieces of information from it and write them to `answer.txt`. Please answer the following questions, one answer per line:

1. How many community-built skills were in the public registry before filtering?
2. How many skills remained after filtering out spam, duplicates, non-English, crypto/finance/trading, and malicious content?
3. What is the largest skill category by count, and how many skills does it have? (format: "Category Name: count")
4. What is the second-largest skill category by count, and how many skills does it have? (format: "Category Name: count")
5. What is the name of the file that defines an OpenClaw skill?
6. What type of API does the OpenClaw gateway expose?
7. What date was the skills registry data collected?
8. How many new benchmark tasks does the paper propose? (just the number)

## Expected Behavior

The agent should:

1. Read and parse the PDF file `openclaw_report.pdf`
2. Find the skills ecosystem statistics section identifying 5,705 total and 2,999 filtered skills
3. Locate the skill category table identifying "AI & LLMs" (287) as largest and "Search & Research" (253) as second
4. Find that skills are defined by `SKILL.md` files
5. Identify the gateway uses a "typed WebSocket API"
6. Find the data collection date of February 7, 2026
7. Count 6 proposed benchmark tasks
8. Write all answers to `answer.txt`, one per line

## Grading Criteria

- [ ] Agent reads the PDF file
- [ ] Output file `answer.txt` is created
- [ ] Total skills count (5705) is correct
- [ ] Filtered skills count (2999) is correct
- [ ] Top category (AI & LLMs: 287) is correct
- [ ] Second category (Search & Research: 253) is correct
- [ ] Skill filename (SKILL.md) is identified
- [ ] API type (typed WebSocket) is identified
- [ ] Data collection date (February 7, 2026) is correct
- [ ] Proposed task count (6) is correct

## Automated Checks

See `automated_check.ts` in this task directory (if present).
