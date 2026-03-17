---
id: task_02_stock
name: Stock Price Research
category: research
grading_type: automated
timeout_seconds: 180
workspace_files: []
workspace_dir: workspace
---

## Prompt

Research the current stock price of Apple (AAPL) and save it to stock_report.txt with the price, date, and a brief market summary.

## Expected Behavior

The agent should:

1. Use web search or financial data tools to find Apple's current stock price
2. Extract the ticker symbol (AAPL), current price, and date
3. Gather a brief market summary or context about the stock
4. Create a file named `stock_report.txt` with this information
5. Format the output in a readable way

The agent may use various approaches including web search, financial APIs, or web scraping. The key is accurate data extraction and proper file creation.

## Grading Criteria

- [ ] File `stock_report.txt` created
- [ ] File contains "AAPL" ticker symbol
- [ ] File contains a numeric price value
- [ ] File contains a date reference
- [ ] File contains market summary or context (at least 50 characters)
- [ ] Content is well-formatted and readable

## Automated Checks

See `automated_check.ts` in this task directory (if present).
