---
id: task_18_market_research
name: Competitive Market Research
category: research
grading_type: hybrid
timeout_seconds: 300
workspace_files: []
workspace_dir: workspace
---

## Prompt

Create a competitive landscape analysis for the **enterprise observability and APM (Application Performance Monitoring)** market segment. Based on your knowledge, identify the top 5 players, their key differentiators, market trends, and typical pricing models. Save your findings to a file called `market_research.md` in a well-structured format with sections for each competitor and a summary comparison table.

If you have access to web search tools, use them to gather the most current information. Otherwise, use your knowledge of this market to produce a thorough analysis.

## Expected Behavior

The agent should:

1. Identify the major competitors (e.g., Datadog, New Relic, Dynatrace, Splunk, Grafana Labs, Elastic, etc.)
2. For each competitor, document:
   - Company overview and market position
   - Key product differentiators
   - Typical pricing model (per-host, per-GB, per-user, etc.)
   - Notable strengths and weaknesses
3. Identify overall market trends (AI/ML integration, OpenTelemetry adoption, consolidation, cloud-native, etc.)
4. Create a well-organized Markdown report with:
   - An executive summary
   - Individual competitor profiles
   - A comparison table
   - Market trends section

The report should read like something a business analyst would produce for a strategy meeting. The agent should use web search if available but can produce a quality analysis from its knowledge base if web search is unavailable.

## Grading Criteria

- [ ] File `market_research.md` created
- [ ] Report identifies at least 5 competitors
- [ ] Each competitor has a meaningful profile (not just a name)
- [ ] Report includes a comparison table or matrix
- [ ] Report covers pricing models for competitors
- [ ] Report discusses current market trends
- [ ] Information appears current and sourced from the web (not purely generic)
- [ ] Report has clear structure with headings and sections
- [ ] Executive summary or introduction is present
- [ ] Writing quality is professional and analytical

## Automated Checks

See `automated_check.ts` in this task directory (if present).

## LLM Judge Rubric

### Criterion 1: Research Depth and Accuracy (Weight: 30%)

**Score 1.0**: Report contains specific, accurate information about each competitor. Details go beyond surface-level descriptions — includes concrete product names, specific features, and market positioning. If web search was used, information is current. If based on knowledge, information is accurate and comprehensive.
**Score 0.75**: Report has good detail on most competitors with specific information, but a few profiles feel thin or rely on generic descriptions.
**Score 0.5**: Report covers competitors at a surface level. Information is mostly accurate but lacks specificity or depth.
**Score 0.25**: Report has minimal detail on competitors. Information feels generic or potentially inaccurate.
**Score 0.0**: Report is missing, has no meaningful competitor analysis, or contains clearly inaccurate information.

### Criterion 2: Analytical Quality (Weight: 25%)

**Score 1.0**: Report reads like a professional market analysis. Includes meaningful comparisons, identifies strategic positioning differences, and draws insightful conclusions about the competitive landscape. The executive summary distills key takeaways effectively.
**Score 0.75**: Report provides good analysis with reasonable comparisons and some strategic insight, but could be more nuanced in its conclusions.
**Score 0.5**: Report presents information but lacks strong analytical framing. Reads more like a list of facts than a strategic analysis.
**Score 0.25**: Report is mostly a raw data dump with minimal analysis or synthesis.
**Score 0.0**: No analytical content present.

### Criterion 3: Market Trends and Context (Weight: 20%)

**Score 1.0**: Report identifies and discusses multiple relevant market trends (e.g., OpenTelemetry adoption, AI-driven observability, platform consolidation, shift to consumption-based pricing, cloud-native monitoring). Trends are connected to how they affect competitive dynamics.
**Score 0.75**: Report discusses several market trends with reasonable context, but connections to competitive impact are limited.
**Score 0.5**: Report mentions trends but only superficially, or misses important current trends.
**Score 0.25**: Trend coverage is minimal or generic.
**Score 0.0**: No market trends discussed.

### Criterion 4: Report Structure and Presentation (Weight: 15%)

**Score 1.0**: Report is excellently organized with clear hierarchy, consistent formatting, a useful comparison table, and professional Markdown formatting. Easy to navigate and extract key information.
**Score 0.75**: Report is well-organized with good formatting. Comparison table present but could be more comprehensive.
**Score 0.5**: Report has basic structure but inconsistent formatting or missing key organizational elements like a comparison table.
**Score 0.25**: Report is poorly organized or hard to navigate.
**Score 0.0**: Report has no discernible structure.

### Criterion 5: Pricing and Business Model Coverage (Weight: 10%)

**Score 1.0**: Report provides specific pricing model details for each competitor (per-host, per-GB, per-user, free tier availability, enterprise pricing). Includes enough detail to be useful for a procurement comparison.
**Score 0.75**: Report covers pricing models for most competitors with reasonable specificity.
**Score 0.5**: Report mentions pricing for some competitors but lacks detail or consistency.
**Score 0.25**: Pricing is barely mentioned or only for one or two competitors.
**Score 0.0**: No pricing information included.

## Additional Notes

- This task tests the agent's ability to produce a comprehensive market analysis. Web search is optional but preferred if available.
- The timeout is set to 300 seconds (5 minutes) to allow for thorough report composition.
- The hybrid grading approach combines automated structural checks (does the file exist, does it have the right sections) with LLM judge assessment of analytical depth.
- The enterprise observability/APM market was chosen because it is a well-established segment with clear market leaders, making it testable with or without web search.
- Grading should reward agents that produce reports with specific, accurate information and good analytical framework.
