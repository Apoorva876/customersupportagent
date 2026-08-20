import json
import urllib.request
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("NVIDIA_API_KEY")

URL = "https://integrate.api.nvidia.com/v1/chat/completions"
MODEL = "meta/llama-3.1-8b-instruct"
current_agent = None
conversation_history = []

def clear_conversation():
    global current_agent, conversation_history
    current_agent = None
    conversation_history = []

def call_model(system_prompt, user_message):

    data = {
        "model": MODEL,
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_message
            }
        ],
        "temperature": 0.7,
        "max_tokens": 300
    }

    request = urllib.request.Request(
        URL,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        },
        method="POST"
    )

    try:

        with urllib.request.urlopen(
            request,
            timeout=30
        ) as response:

            result = json.loads(
                response.read().decode("utf-8")
            )

        return result["choices"][0]["message"]["content"]

    except Exception as error:

        return f"Sorry, there was a connection problem: {error}"




def detect_agent(message):

    text = message.lower()

    # ACCOUNT AGENT
    if any(word in text for word in [
        "account",
        "password",
        "login",
        "profile",
        "mobile number",
        "phone number",
        "change mobile",
        "change phone",
        "email address"
    ]):
        return "account"

    # BILLING AGENT
    if any(word in text for word in [
        "refund",
        "money",
        "payment",
        "billing",
        "charged",
        "invoice",
        "transaction"
    ]):
        return "billing"

    # SHIPPING AGENT
    if any(word in text for word in [
        "delivery",
        "shipping",
        "tracking",
        "package",
        "where is my order",
        "delayed"
    ]):
        return "shipping"

    # TECHNICAL AGENT
    if any(word in text for word in [
        "error",
        "bug",
        "crash",
        "not working",
        "technical",
        "website problem",
        "app problem"
    ]):
        return "technical"

    # ORDER AGENT
    if any(word in text for word in [
        "order",
        "return",
        "cancel",
        "exchange",
        "damaged",
        "wrong product"
    ]):
        return "order"

    return None


# ============================================================
# AGENT PROMPTS
# ============================================================

def get_agent_prompt(agent):

    prompts = {

        "order": """
You are a friendly and intelligent Order Support Agent.

Help customers with:
- Returns
- Order cancellation
- Product exchange
- Damaged products
- Wrong products
- General order problems

Have a natural conversation.

Do not immediately give a final answer if you need more information.
Ask for relevant details such as the Order ID when necessary.

Remember the previous conversation and respond based on what the
customer has already told you.

Example:

Customer: I want to return my product.
Assistant: I'm sorry to hear that. I can help you with the return.
Could you please provide your Order ID?

Be friendly, natural and helpful.
Do not mention that you are an AI.
""",

        "billing": """
billing_assistent:You are a friendly and intelligent Billing and Refund Support Agent.

Help customers with:
- Refunds
- Money back requests
- Payment failures
- Duplicate charges
- Billing issues
- Transaction problems

Have a natural conversation.

Ask for an Order ID or transaction ID only when necessary.

If a refund is successfully registered, you can tell the customer:

"Your refund request has been registered successfully. The amount is
expected to be deposited into your original payment method within
approximately 2 hours."

Do not repeatedly ask for the same information.

Be friendly and helpful.
""",

        "technical": """
technical_assistent: You are a friendly and intelligent Technical Support Agent.

Help customers with:
- App problems
- Website problems
- Errors
- Bugs
- Crashes
- Features not working

Have a natural conversation.

First understand the customer's problem.
Ask follow-up questions if necessary.

Example:

Customer: My app is not working.
Assistant: I'm sorry you're facing this problem. Could you tell me
what happens when you open the app or what error you are seeing?

Be friendly and helpful.
""",

        "shipping": """
shipping_assistent: You are a friendly and intelligent Shipping Support Agent.

Help customers with:
- Delivery tracking
- Shipping problems
- Delayed packages
- Missing packages
- Delivery status

Ask for an Order ID or tracking number when needed.

Example:

Customer: Where is my order?
Assistant: I'd be happy to check that for you. Could you please share
your Order ID or tracking number?

Be friendly and natural.
""",

        "account": """
account_assistent:You are a friendly and intelligent Account Support Agent.

Help customers with:
- Changing mobile numbers
- Changing phone numbers
- Password reset
- Login problems
- Email changes
- Profile updates
- Account problems

Have a natural conversation.

Example:

Customer: I want to change my mobile number.
Assistant: Sure! I can help you update your mobile number.
Please enter the new mobile number you would like to use.

After the customer provides the new number:

Assistant: Thank you! Your request to update your mobile number has
been registered successfully. The change will be completed shortly.

Do not repeatedly ask for the same information.

Be friendly and helpful.
"""
    }

    return prompts.get(
        agent,
        """
You are a helpful customer support assistant.
Answer naturally and politely.
"""
    )


# ============================================================
# BUILD CONVERSATION FOR AI
# ============================================================

def build_conversation():

    history_text = ""

    
    recent_history = conversation_history[-10:]

    for item in recent_history:

        history_text += (
            f"{item['role'].capitalize()}: "
            f"{item['message']}\n"
        )

    return history_text


# ============================================================
# MAIN SMART WORKFLOW
# ============================================================

def smart_workflow(message):

    global current_agent
    global conversation_history

    text = message.lower().strip()


    
    end_words = [
        "query end",
        "end chat",
        "bye",
        "goodbye",
        "thank you",
        "thanks",
        "that's all",
        "thats all",
        "done"
    ]

    if text in end_words:

        current_agent = None
        conversation_history = []

        return {
            "response": (
                "You're welcome! 😊 "
                "Thank you for contacting Customer Support. "
                "Have a wonderful day!"
            ),
            "agent": None
        }


    # --------------------------------------------------------
    # DETECT NEW TOPIC
    # --------------------------------------------------------

    detected_agent = detect_agent(message)

    if detected_agent is not None:

        current_agent = detected_agent


    # --------------------------------------------------------
    # FIRST MESSAGE / GENERAL ASSISTANT
    # --------------------------------------------------------

    if current_agent is None:

        active_agent = "general"

        system_prompt = """
You are a friendly Smart Customer Support Assistant.

Start the conversation naturally.

You can help with:
- Orders and returns
- Refunds and payments
- Technical problems
- Shipping and delivery
- Account problems

If the customer says hello, greet them and ask how you can help.

Keep responses short, friendly and natural.
"""

    else:

        active_agent = current_agent

        system_prompt = get_agent_prompt(current_agent)


    # --------------------------------------------------------
    # ADD CONVERSATION HISTORY
    # --------------------------------------------------------

    history = build_conversation()

    full_message = f"""
Previous conversation:

{history}

Customer's new message:

{message}

Respond naturally based on the conversation.
Do not repeat questions that were already answered.
"""


    # --------------------------------------------------------
    # GET AI RESPONSE
    # --------------------------------------------------------

    response = call_model(
        system_prompt,
        full_message
    )


    # --------------------------------------------------------
    # SAVE MEMORY
    # --------------------------------------------------------

    conversation_history.append({
        "role": "customer",
        "message": message
    })

    conversation_history.append({
        "role": "assistant",
        "message": response
    })


    return {
        "response": response,
        "agent": active_agent
    }


# ============================================================
# TEST IN TERMINAL
# ============================================================

if __name__ == "__main__":

    print("\n========================================")
    print(" SMART CUSTOMER SUPPORT ASSISTANT")
    print("========================================\n")

    print("AI: Hello! 😊 Welcome to Customer Support.")
    print("AI: How can I help you today?\n")

    while True:

        user_message = input("You: ")

        response = smart_workflow(user_message)

        print("\nAI:", response)
        print()