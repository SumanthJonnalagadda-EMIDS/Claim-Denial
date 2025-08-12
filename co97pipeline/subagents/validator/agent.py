import json
from datetime import datetime
from typing import List, Tuple
import pandas as pd
from google.adk.agents import LlmAgent
from dotenv import load_dotenv
import os
import requests
# ------------------------------------------------------------------
# NCCI Edit Rule Class
# ------------------------------------------------------------------


class NCCIEditRules:
    """
    Loads an NCCI PTP edit Excel and provides a pairwise check method.
    Columns expected (after skiprows=2):
      ["Column 1", "Column 2", "Existence", "Effective", "Deletion", "Modifier", "PTP Edit Rationale"]
    """

    def __init__(self, filepath: str):
        self.df = pd.read_excel(filepath, engine="openpyxl", skiprows=2)
        # Standardize column names
        self.df.columns = [
            "Column 1", "Column 2", "Existence", "Effective",
            "Deletion", "Modifier", "PTP Edit Rationale"
        ]
        # Normalize text fields
        for col in ("Effective", "Deletion", "Modifier"):
            self.df[col] = self.df[col].astype(str).str.strip()

    def check_pair(self, cpt1: str, cpt2: str, modifiers: List[str], service_date: str) -> Tuple[bool, str]:
        """
        Return (is_valid: bool, reason: str)
        - service_date must be 'YYYY-MM-DD'
        - modifiers is a list of modifier strings, e.g. ['25', '59']
        """
        try:
            claim_date = int(datetime.strptime(
                service_date, "%Y-%m-%d").strftime("%Y%m%d"))
        except Exception as e:
            return False, f"Invalid service_date format: {service_date}. Expected YYYY-MM-DD."

        # Match rows for pair in either order
        mask = (
            ((self.df["Column 1"] == str(cpt1)) & (self.df["Column 2"] == str(cpt2))) |
            ((self.df["Column 1"] == str(cpt2)) &
             (self.df["Column 2"] == str(cpt1)))
        )
        rows = self.df[mask]

        if rows.empty:
            return True, "No NCCI restriction applies for this code pair."

        for _, row in rows.iterrows():
            eff = row["Effective"]
            del_ = row["Deletion"]
            flag = row["Modifier"]
            rationale = row.get("PTP Edit Rationale", "No rationale provided")

            # Effective / deletion checks
            if eff != "*" and eff.isdigit() and claim_date < int(eff):
                return False, f"Edit effective from {eff}; claim date precedes this. {rationale}"
            if del_ != "*" and del_.isdigit() and claim_date > int(del_):
                return False, f"Edit deleted after {del_}; claim date falls outside active range. {rationale}"

            # Modifier logic
            has_allowed_mod = any(m in modifiers for m in ["25", "59", "76"])
            if flag == "0" and has_allowed_mod:
                return False, f"Modifier provided but not allowed for this pair. {rationale}"
            if flag == "1" and not has_allowed_mod:
                return False, f"Modifier required but missing for this pair. {rationale}"
            # flag == "9" => modifier irrelevant; continue checks
        return True, "Code pair passes NCCI edit checks."


# ------------------------------------------------------------------
# Path to Excel File (adjust to your environment)
# ------------------------------------------------------------------
EXCEL_PATH = r"D:\EMIDS\CLAIM\co97pipeline\ccioph-v312r0-f1.xlsx"
ncci = NCCIEditRules(EXCEL_PATH)

# ------------------------------------------------------------------
# Claim Validation Function (tool)
# ------------------------------------------------------------------


def validate_claim_with_rules(claim_json: dict) -> dict:
    """
    Tool to validate claim serviceLines against NCCI pair rules.
    Returns: {
        "validation_status": "valid"|"invalid",
        "pairwise_results": [ {"pair": "CPT1-CPT2", "valid": bool, "reason": str}, ... ]
    }
    """
    service_lines = claim_json.get("serviceLines", [])
    # Build (cpt, modifiers[], serviceDate) for each line
    cpt_mods = [
        (
            sl.get("procedureCode", "").strip(),
            [m for m in [sl.get("modifier1", ""),
                         sl.get("modifier2", "")] if m],
            sl.get("serviceDate", "")
        )
        for sl in service_lines
    ]

    results = []
    for i in range(len(cpt_mods)):
        c1, m1, date1 = cpt_mods[i]
        for j in range(i + 1, len(cpt_mods)):
            c2, m2, date2 = cpt_mods[j]
            # use earliest date between the two lines for pair evaluation
            claim_date = min(date1 or date2, date2 or date1)
            valid, reason = ncci.check_pair(c1, c2, m1 + m2, claim_date)
            results.append({
                "pair": f"{c1}-{c2}",
                "valid": bool(valid),
                "reason": reason
            })

    status = "invalid" if any(not r["valid"] for r in results) else "valid"
    return {
        "validation_status": status,
        "pairwise_results": results
    }


# prompt_path = "D:\EMIDS\CLAIM\co97pipeline\v1\validator_prompt.txt"
# with open(prompt_path, "r", encoding="utf-8") as f:
#     prompt_text = f.read()

# prompt_url = "https://github.com/SumanthJonnalagadda-EMIDS/prompts/blob/main/validator_prompt.txt"

load_dotenv()

# Fetch validator prompt from .env
prompt_url = os.getenv("PROMPT_URL_VALIDATOR")
if not prompt_url:
    raise ValueError("PROMPT_URL_VALIDATOR not found in .env")
response = requests.get(prompt_url)
response.raise_for_status()

prompt_text = response.text

# ------------------------------------------------------------------
# LLM Agent Initialization
# ------------------------------------------------------------------
co97_validator_agent = LlmAgent(
    name="CO97ValidatorAgent",
    model="gemini-2.0-flash",
    description="Analyzes CPT code pairs for CO97 denial risk using NCCI, MPFS, modifier crosswalk, and payer policy.",
    tools=[validate_claim_with_rules],
    instruction=prompt_text,
    # agent's returned payload key (adjust if your pipeline expects different key)
    output_key="co97_evaluation"
)
