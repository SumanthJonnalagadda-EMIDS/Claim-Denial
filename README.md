# Healthcare Claim Form & CO97 Denial Analysis

This repository contains two main parts:

1. **Healthcare Claim Form** – A React + TypeScript web application for uploading, parsing, previewing, and exporting healthcare claim denial data.
2. **CO97 Denial Analysis & Validation** – A Python-based toolset leveraging Google ADK + Gemini for validating claims against CO97 denial logic using NCCI PTP edits, modifier rules, and AI-driven analysis.

---

## 📄 Healthcare Claim Form

A **React + TypeScript** web app for handling healthcare claim denials (focused on 837-style data).  
Upload a claim file, parse & preview results, generate a PDF, and optionally send it via email.

### 🚀 Features
- **Upload & Parse**: Process healthcare claim or denial data.
- **Structured Preview**: View parsed data in a clean UI.
- **PDF Generation**: Export results via `pdfGenerator.ts` or HTML templates.
- **Email Sending**: Send PDFs via configured email services.
- **Local CORS Proxy**: `cors_fix.py` helper for dev API calls.

### 🛠 Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Utilities**: Custom parsers, PDF generators
- **Email**: Configurable SMTP helpers

### 📂 Key Directories
- `src/components/` – UI components (`FileUpload`, `ResultsPage`, etc.)
- `src/utils/` – Core logic (PDF & response parsing, email service)
- `src/examples/` – Parsing examples
- `public/` – PDF/HTML demo files

### 🔄 Typical Flow
1. Upload claim/response file
2. Parse fields → view in `ResultsPage`
3. Generate PDF output
4. (Optional) Email results

### 📦 Setup
```bash
npm install
npm run dev
```

### 📧 Email Setup
See `EMAIL_SERVICE_README.md` for configuration & testing.

### 🛠 Dev Notes
- Run `cors_fix.py` to bypass CORS in local testing.
- Use HTML demos (`clean_pdf_generator.html`, `simple_pdf_demo.html`) for quick PDF layout testing.
- **Not** a full EDI 837 validator — focused on human-readable output.

---

## 🏥 CO97 Denial Analysis & Validation

A **Google ADK + Python** toolset for analyzing and validating healthcare claims for **CO97 denial risk**.  
Combines **NCCI PTP Edit checks**, **modifier rules**, and **custom LLM prompts** for automated claim evaluation.

### 🚀 Features
- **Pairwise CPT Validation**: Checks CPT code combinations against NCCI rules.
- **Modifier Compliance**: Flags missing/invalid modifiers based on allowed rules.
- **AI Analysis**: Uses Gemini-based LLM agents for denial risk explanation & recommendations.
- **Prompt Config via `.env`**: Load analyzer/validator prompts dynamically from GitHub.

### 🛠 Tech Stack
- **Core**: Python, Pandas, Requests
- **AI**: Google ADK, Gemini 2.0 Flash
- **Excel Parsing**: OpenPyXL
- **Environment Config**: python-dotenv

### 📂 Key Components
- `NCCIEditRules` – Loads and validates CPT pair restrictions from Excel
- `validate_claim_with_rules()` – Tool for pairwise service line checks
- `CO97ValidatorAgent` – LLM-based validator using prompt-driven reasoning
- `.env` – Holds API keys and prompt URLs

### 🔄 Typical Flow
1. Load NCCI PTP Edit Excel
2. Validate CPT pairs & modifiers
3. Pass structured claim to LLM agent
4. Return risk assessment & recommendations

### 📦 Setup
```bash
pip install python-dotenv requests pandas openpyxl google-adk
```

### ⚙️ Env Example
```env
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY

PROMPT_URL_ANALYZER=https://raw.githubusercontent.com/SumanthJonnalagadda-EMIDS/prompts/main/analyzer_prompt.txt
PROMPT_URL_VALIDATOR=https://raw.githubusercontent.com/SumanthJonnalagadda-EMIDS/prompts/main/validator_prompt.txt
```

### 📝 Notes
- Excel format must follow NCCI PTP Edit structure (skip first 2 rows).
- Designed for CO97 denial logic but adaptable to other denial codes.
- Not a replacement for full claim submission systems — focuses on analysis & validation.

---
