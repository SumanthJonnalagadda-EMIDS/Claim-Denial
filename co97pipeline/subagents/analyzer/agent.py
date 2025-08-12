# from google.adk.agents import LlmAgent

# co97_analyzer_agent = LlmAgent(
#     name="CO97AnalyzerAgent",
#     model="gemini-2.0-flash",
#     description="Predicts likelihood of CO97 denial based on procedure bundling rules, modifier logic, and diagnosis linkage.",
#     instruction="""
# You are a CO97 claim denial analyzer agent.

# CO97 means: "The benefit for this service is included in the payment/allowance for another service/procedure already adjudicated."

# --- INPUT FIELDS ---
# - code1, code2: CPT/HCPCS codes billed together
# - modifier_used: Modifier applied, if any
# - diagnosis_relationship: "Same" or "Different"
# - bundling_rule: "strict", "soft", or "none"
# - modifier_acceptability: "high", "low", or "not applicable"
# - validation_status: "valid" or reason for invalid

# --- YOUR TASK ---
# If `validation_status` is not 'valid':
# Return:
# {
#   "code": "CO97",
#   "denied": null,
#   "risk_level": null,
#   "decision": "Cannot determine",
#   "reason": "Claim data invalid: <validation_status>",
#   "reasoning": null,
#   "suggested_fix": "Fix the claim validation issues before analysis."
# }

# If `validation_status` is "valid", apply this logic:

# --- DECISION & RISK RULES ---
# 1. If bundling_rule is "none" → decision: "Pass", risk_level: "None"
# 2. If bundling is "soft":
#     a. Modifier is accepted (25, 59, XE, XP, XS, XU) AND modifier_acceptability is "high" → "Pass", "Low"
#     b. Modifier is weak or not commonly accepted → "Medium", possibly "Fail" depending on diagnosis
# 3. If bundling is "strict":
#     a. Modifier is missing or weak → "Fail", "High"
#     b. Modifier is strong but diagnosis is same → still risky → "Medium" or "High"
# 4. No modifier used → risk at least "Medium" if bundling exists
# 5. diagnosis_relationship = "Same" → increases bundling risk

# --- OUTPUT FORMAT ---

# Return this JSON:
# {
#   "code": "CO97",
#   "denied": true or false,
#   "risk_level": "None" | "Low" | "Medium" | "High",
#   "decision": "Pass" | "Fail",
#   "reasoning": "<Short and clear clinical + rules-based explanation>",
#   "reason": "<Longer explanation covering bundling logic, modifier, and diagnosis relationship>",
#   "suggested_fix": "<Suggestion like better modifier, change in documentation, etc.>"
# }
# """,
#     output_key="co97_prediction",
# )

from google.adk.agents import LlmAgent
import requests
# prompt_path = "D:\EMIDS\CLAIM\co97pipeline\v1\analyzer_prompt.txt"
# with open(prompt_path, "r", encoding="utf-8") as f:
#     prompt_text = f.read()

prompt_url = "https://raw.githubusercontent.com/SumanthJonnalagadda-EMIDS/prompts/main/analyzer_prompt.txt"

response = requests.get(prompt_url)
response.raise_for_status()

prompt_text = response.text

co97_analyzer_agent = LlmAgent(
    name="CO97AnalyzerAgent",
    model="gemini-2.0-flash",
    description="Predicts likelihood of CO97 denial based on procedure bundling rules, modifier logic, diagnosis linkage, and outputs probability score as a percentage.",
    instruction=prompt_text,
    output_key="co97_prediction",
)
