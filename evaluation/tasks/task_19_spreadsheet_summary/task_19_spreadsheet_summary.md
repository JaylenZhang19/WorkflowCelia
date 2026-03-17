---
id: task_19_spreadsheet_summary
name: CSV and Excel Data Summarization
category: data_analysis
grading_type: hybrid
timeout_seconds: 180
grading_weights:
  automated: 0.6
  llm_judge: 0.4
workspace_files:
  - path: quarterly_sales.csv
  - path: company_expenses.xlsx
workspace_dir: workspace
---

## Prompt

I have two data files in my workspace that have been provided for you to analyze:

1. `quarterly_sales.csv` — a CSV file with sales transactions containing columns: Date, Region, Product, Units_Sold, Unit_Price, Revenue, Cost (24 rows of data)
2. `company_expenses.xlsx` — an Excel workbook with two sheets: "Q1_Expenses" (employee expense reports with 12 records) and "Budgets" (departmental budget allocations)

Please read and analyze both files, then write a summary report to `data_summary.md` that includes:

- **CSV Analysis**: Total revenue, total profit (revenue minus cost), total units sold, the top-performing region by revenue, and the top-selling product by revenue.
- **Excel Analysis**: Total Q1 expenses, the department with the highest expenses, the employee with the highest total expenses, and a comparison of Q1 actual expenses vs Q1 budgets by department.
- A brief overall insights section combining findings from both files.

---

## Expected Behavior

The agent should:

1. Read and parse the CSV file (standard CSV format, straightforward to parse)
2. Read and parse the Excel file (requires handling `.xlsx` format with multiple sheets)
3. Compute correct aggregate statistics from both files
4. Write a well-structured markdown summary report to `data_summary.md`

The CSV contains 24 rows of sales data across 4 regions (North, South, East, West) and 3 products (Widget A, B, C). The Excel file has 12 expense records across 4 departments and a separate budgets sheet with quarterly allocations for each department.

Key expected values:

- CSV total revenue: $119,900
- CSV total profit: $47,960
- CSV total units: 3,775
- CSV top region: East ($33,075)
- CSV top product: Widget B ($47,400)
- Excel total Q1 expenses: $15,430
- Excel top department: Engineering ($7,680)
- Excel top employee: Alice Chen ($5,400)

---

## Grading Criteria

- [ ] Agent successfully reads the CSV file
- [ ] Agent successfully reads the Excel file (including multiple sheets)
- [ ] Summary report file `data_summary.md` is created
- [ ] Total revenue is correctly reported (~$119,900)
- [ ] Total profit is correctly calculated (~$47,960)
- [ ] Top region by revenue is identified (East)
- [ ] Top product by revenue is identified (Widget B)
- [ ] Total Q1 expenses are correctly reported (~$15,430)
- [ ] Top spending department is identified (Engineering)
- [ ] Top spending employee is identified (Alice Chen)
- [ ] Budget vs actual comparison is included
- [ ] Report is well-structured and readable

---

## Automated Checks

See `automated_check.ts` in this task directory (if present).

## LLM Judge Rubric

### Criterion 1: Data Reading and Parsing (Weight: 25%)

**Score 1.0**: Agent correctly read both the CSV file and the multi-sheet Excel file, extracting all relevant data without errors.
**Score 0.75**: Agent read both files but had minor issues with one format (e.g., only read one Excel sheet).
**Score 0.5**: Agent read one file correctly but struggled with the other format.
**Score 0.25**: Agent attempted to read the files but encountered significant parsing errors.
**Score 0.0**: Agent failed to read either file or did not attempt data extraction.

### Criterion 2: Analytical Accuracy (Weight: 35%)

**Score 1.0**: All computed statistics (totals, top performers, comparisons) are numerically correct and clearly presented.
**Score 0.75**: Most statistics are correct with one or two minor numerical errors.
**Score 0.5**: Some statistics are correct but several key figures are wrong or missing.
**Score 0.25**: Few statistics are correct; major calculation errors present.
**Score 0.0**: No correct statistics or analysis not attempted.

### Criterion 3: Report Quality and Structure (Weight: 25%)

**Score 1.0**: Report is well-organized with clear sections, proper markdown formatting, and easy-to-read presentation of findings. Includes headers, tables or formatted lists for data.
**Score 0.75**: Report is organized and readable with minor formatting issues.
**Score 0.5**: Report contains the information but is poorly organized or hard to follow.
**Score 0.25**: Report is disorganized or missing major sections.
**Score 0.0**: No report created or report is empty/unusable.

### Criterion 4: Insights and Synthesis (Weight: 15%)

**Score 1.0**: Report includes thoughtful cross-file insights, meaningful observations about trends, and actionable takeaways combining data from both sources.
**Score 0.75**: Report includes some cross-file observations but could be more insightful.
**Score 0.5**: Report presents data from both files but without meaningful synthesis.
**Score 0.25**: Report barely connects findings from the two data sources.
**Score 0.0**: No synthesis or insights provided.

---

## Additional Notes

This task tests the agent's ability to:

- Parse multiple file formats (CSV and XLSX)
- Handle multi-sheet Excel workbooks
- Perform numerical aggregations and comparisons
- Produce a structured written summary combining multiple data sources

The data is intentionally small and clean (no missing values, no encoding issues) so the focus is on correctly reading both formats and computing accurate summaries. The CSV has 24 rows and the Excel has 12 expense rows plus 4 budget rows across 2 sheets.

Known correct values for automated checking:

- CSV: 24 rows, total revenue $119,900, total cost $71,940, total profit $47,960, 3,775 units
- CSV top region: East ($33,075), top product: Widget B ($47,400)
- Excel Q1 expenses: $15,430, top dept: Engineering ($7,680), top employee: Alice Chen ($5,400)
- Excel Q1 budgets: Engineering $25,000, Marketing $15,000, Sales $12,000, HR $8,000
