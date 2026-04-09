import json
from pathlib import Path

from nobodywho import Chat, tool

ROOT_DIR = Path(__file__).resolve().parent
DATA_PATH = ROOT_DIR / "nobodyllm_database.json"
## MODEL_PATH = ROOT_DIR / "Qwen_Qwen3-0.6B-Q4_K_M.gguf"
MODEL_PATH = ROOT_DIR / "Qwen_Qwen3-4B-Q4_K_M.gguf"


def load_db() -> dict:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Database file not found at {DATA_PATH}. "
            "Expected: nobodyllm_database.json in the repository root."
        )

    with DATA_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


DB = load_db()
GUIDE_FIELDS = ["Process:", "Flavor notes:", "Grind:", "Temperature:", "Note:"]


@tool(
    description=(
        "Get coffee processing profile and brew adjustments. "
        "Valid process values: washed, natural, honey."
    ),
    params={"process": "Coffee process type: washed, natural, or honey"},
)
def get_coffee_profile(process: str) -> str:
    key = process.strip().lower()
    if key not in DB:
        return (
            "Unknown process type. Use one of: washed, natural, honey. "
            f"You provided: {process}"
        )

    profile = DB[key]
    flavors = ", ".join(profile["flavor"])
    adjustments = profile["brew_adjustments"]

    return (
        f"Process: {key}\n"
        f"Flavor notes: {flavors}\n"
        f"Grind: {adjustments['grind']}\n"
        f"Temperature: {adjustments['temperature']}\n"
        f"Note: {adjustments['note']}"
    )


def extract_brewing_guide(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    guide_lines = []

    for field in GUIDE_FIELDS:
        match = next((line for line in lines if line.startswith(field)), None)
        if match:
            guide_lines.append(match)

    if guide_lines:
        return "\n".join(guide_lines)

    return text.strip()


def main() -> None:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

    chat = Chat(
        str(MODEL_PATH),
        tools=[get_coffee_profile],
        template_variables={"enable_thinking": False},
        system_prompt=(
            "You are a coffee brewing assistant. "
            "Use the get_coffee_profile tool when the user asks about washed, natural, or honey coffee processes."
            "Reply with only these 5 lines and nothing else: "
            "Process, Flavor notes, Grind, Temperature, Note."
        ),
    )

    print("Type your question (or 'exit' to quit).")
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in {"exit", "quit"}:
            break

        stream = chat.ask(user_input)
        response_text = ""
        for token in stream:
            response_text += token

        guide = extract_brewing_guide(response_text)
        print(f"Assistant: {guide}\n")


if __name__ == "__main__":
    main()
