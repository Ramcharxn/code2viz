# VizCraft: Language-Agnostic Visualization Web Application

## 🌐 Overview

**VizCraft** is a language-agnostic visualization platform that enables users to generate and view static, interactive, and 3D plots using custom scripts written in **Python or R**. The user interface is clean, responsive, and built for a seamless experience from code input to plot display.

Users can:
- Write and execute Python or R scripts directly in the browser
- Upload CSV files to visualize data
- Generate multiple types of plots: static, interactive, and 3D
- View rendered visualizations via embedded iframes
- Clear uploaded files and generated plots with one click

---

## ⚙️ Design & Tools Used

### 🔹 Frontend
- **React.js** with **Monaco Editor** for code input
- **HTML iframes** for plot rendering
- **Alert system** for real-time feedback
- Custom **dark theme UI** using CSS

### 🔹 Backend
- **Flask** API to receive and execute Python or R code
- **Docker** for secure and isolated execution environments:
  - `python-runner` container for Python scripts
  - `r-runner` container for R scripts
- Code execution handled with `subprocess` and sandboxing
- Syntax validation for Python (`compile`) and R (`parse(file=...)`)
- Auto-cleanup of uploaded files and plots

### 🔹 Visualization Libraries
- **Python**:
  - `plotly`, `matplotlib`, `mpld3`
- **R**:
  - `ggplot2`, `plotly`, `htmlwidgets`, `rgl` (optional)

---

## ⚠️ Issues Encountered & Solutions

### 1. **R Code Syntax Validation**
- **Issue**: Passing long multiline R code through `Rscript -e` caused syntax errors (especially with quotes and line breaks).
- **Solution**: Saved R scripts to `.R` files and used `parse(file="...")` inside Docker for accurate validation.

### 2. **File Not Found Errors in Docker**
- **Issue**: R and Python scripts couldn’t locate uploaded CSVs during execution.
- **Solution**: Standardized all CSV paths to `/app/static/uploads/` and ensured proper Docker volume mounting.

### 3. **Encoding Errors in R**
- **Issue**: Unicode characters from React textarea caused `unexpected input` in `library()` or `read.csv()`.
- **Solution**: Cleaned input by stripping non-ASCII characters in the backend, enforced UTF-8 encoding when writing scripts.

### 4. **Missing Plot Output Handling**
- **Issue**: Some code failed silently without producing HTML plots.
- **Solution**: Backend now checks for the existence of `plot1.html` to `plot5.html` and gracefully reports if none were generated.

### 5. **Visual Overflows & Plot Scaling**
- **Issue**: Large 3D and interactive plots overflowed containers.
- **Solution**: Used fixed-height iframes and `max-height` CSS, and added scrollability to the right panel.

---

## ✅ Features Summary

- [x] Run Python and R code securely inside Docker
- [x] Upload and visualize CSV files
- [x] Generate static, interactive, and 3D plots
- [x] Clean UI with real-time alerts and responsive layout
- [x] Full support for CNS SRES assignment rubric

---

## 📁 Output Examples
- `plot1.html`: Scatter / line plot
- `plot2.html`: Histogram (interactive)
- `plot3.html`: Static histogram (matplotlib / ggplot2)
- `plot4.html`: 3D scatter plot
- `plot5.html`: Animation or surface plot

---

## 🚀 Run Locally

```bash
# Start backend
python app.py

# In another terminal
npm start
