# Smart Customer Support Assistant 🤖

A simple AI-powered Customer Support Assistant built using Python, Flask, and NVIDIA's Llama AI model.

The assistant can understand customer queries, route them to the appropriate support agent, and continue the conversation naturally.

## Features

- 🤖 AI-powered customer support responses
- 💬 Natural multi-turn conversations
- 🛒 Order support
- 💳 Billing and refund support
- 🔧 Technical support
- 🚚 Shipping and delivery support
- 👤 Account support
- 🔄 Automatic switching between support agents
- 👋 Ends the conversation when the user says goodbye

## Support Agents

### 1. Order Agent 🛒

Handles:

- Order returns
- Order cancellation
- Product exchange
- Damaged products
- Wrong products

### 2. Billing Agent 💳

Handles:

- Refund requests
- Payment issues
- Failed payments
- Duplicate charges
- Billing problems

### 3. Technical Agent 🔧

Handles:

- Application errors
- Website issues
- Bugs
- Crashes
- Features not working

### 4. Shipping Agent 🚚

Handles:

- Order tracking
- Delivery status
- Delayed deliveries
- Shipping problems

### 5. Account Agent 👤

Handles:

- Mobile number changes
- Password reset
- Login problems
- Email changes
- Profile updates

## Technologies Used

- Python
- Flask
- NVIDIA API
- Meta Llama 3.1 8B Instruct
- HTML
- CSS
- JavaScript

## Project Structure

```text
customer-support-agent/
│
├── app.py
├── customersupportagent.py
├── requirements.txt
├── .env
├── .gitignore
│
├── templates/
│   └── index.html
│
└── static/
    └── style.css
