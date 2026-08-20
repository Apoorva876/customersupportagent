// ======================== DOM ELEMENTS ========================
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const newChatBtn = document.getElementById('newChatBtn');
const voiceOutputToggle = document.getElementById('voiceOutputToggle');
const chatHistory = document.getElementById('chatHistory');

// ======================== STATE ========================
let isRecording = false;
let recognition = null;
let chatSessions = [];
let currentSessionId = null;
let chatCounter = 0;

// ======================== INIT SPEECH RECOGNITION ========================
function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        voiceBtn.style.display = 'none';
        console.warn('Speech Recognition not supported');
        return null;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = function () {
        isRecording = true;
        voiceBtn.classList.add('recording');
        userInput.placeholder = 'Listening...';
    };

    rec.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        autoResize();
        sendMessage();
    };

    rec.onerror = function (event) {
        console.error('Speech error:', event.error);
        stopRecording();
    };

    rec.onend = function () {
        stopRecording();
    };

    return rec;
}

recognition = initRecognition();

function stopRecording() {
    isRecording = false;
    voiceBtn.classList.remove('recording');
    userInput.placeholder = 'Type your message or click the mic...';
}

// ======================== VOICE INPUT ========================
voiceBtn.addEventListener('click', function () {
    if (!recognition) {
        alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
        return;
    }

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
});

// ======================== SEND MESSAGE ========================
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

userInput.addEventListener('input', autoResize);

function autoResize() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Hide welcome
    const welcome = chatMessages.querySelector('.welcome-msg');
    if (welcome) welcome.remove();

    // Remove old typing indicator if any
    removeTyping();

    appendMessage('user', message);
    userInput.value = '';
    userInput.style.height = 'auto';

    showTyping();

    fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
    })
        .then(res => res.json())
        .then(data => {
            removeTyping();
            if (data.response) {
                appendMessage('bot', data.response, data.agent);
                if (voiceOutputToggle.checked) {
                    speakText(data.response);
                }
            } else if (data.error) {
                appendMessage('bot', 'Sorry, something went wrong. Please try again.');
            }
        })
        .catch(() => {
            removeTyping();
            appendMessage('bot', 'Could not connect to the server. Make sure the app is running.');
        });
}

// ======================== APPEND MESSAGE ========================
function appendMessage(role, text, agent) {
    const row = document.createElement('div');
    row.className = 'message-row ' + role;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'AI';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    if (role === 'bot' && agent) {
        const agentBadge = document.createElement('div');
        agentBadge.className = 'agent-badge ' + agent;
        agentBadge.textContent = agent.charAt(0).toUpperCase() + agent.slice(1) + ' Agent';
        bubble.appendChild(agentBadge);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    bubble.appendChild(textSpan);

    if (role === 'bot') {
        const voiceBtnEl = document.createElement('button');
        voiceBtnEl.className = 'voice-read-btn';
        voiceBtnEl.title = 'Read aloud';
        voiceBtnEl.innerHTML = '🔊';
        voiceBtnEl.addEventListener('click', function () {
            speakText(text);
        });
        bubble.appendChild(voiceBtnEl);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    chatMessages.appendChild(row);

    scrollToBottom();
}

// ======================== TYPING INDICATOR ========================
function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.style.background = '#e2e8f0';
    avatar.style.color = '#1e293b';
    avatar.style.width = '34px';
    avatar.style.height = '34px';
    avatar.style.borderRadius = '50%';
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.fontSize = '13px';
    avatar.style.fontWeight = '700';
    avatar.textContent = 'AI';

    const bubble = document.createElement('div');
    bubble.className = 'typing-bubble';

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        bubble.appendChild(dot);
    }

    typing.appendChild(avatar);
    typing.appendChild(bubble);
    chatMessages.appendChild(typing);

    scrollToBottom();
}

function removeTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
}

// ======================== TEXT TO SPEECH ========================
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = 'en-US';

    window.speechSynthesis.speak(utterance);
}

// ======================== NEW CHAT ========================
newChatBtn.addEventListener('click', function () {
    // Save current session
    const messages = chatMessages.querySelectorAll('.message-row');
    if (messages.length > 0) {
        chatCounter++;
        const title = 'Chat ' + chatCounter;
        chatSessions.push({
            id: currentSessionId || Date.now(),
            title: title,
            html: chatMessages.innerHTML
        });
        renderHistory();
    }

    // Clear chat
    chatMessages.innerHTML = `
        <div class="welcome-msg">
            <div class="welcome-icon">👋</div>
            <h2>Welcome to Customer Support</h2>
            <p>Ask me anything about billing, orders, shipping, technical issues, or your account. You can also use your <strong>microphone</strong> to speak!</p>
        </div>
    `;
    currentSessionId = Date.now();
});

// ======================== CHAT HISTORY ========================
function renderHistory() {
    // Remove all existing history items
    chatHistory.querySelectorAll('.history-item').forEach(el => el.remove());

    chatSessions.forEach(function (session, index) {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = session.title;
        item.addEventListener('click', function () {
            // Save current state before switching
            const currentMessages = chatMessages.querySelectorAll('.message-row');
            if (currentMessages.length > 0) {
                // Update existing session if it has content
            }

            chatMessages.innerHTML = session.html;

            // Mark active
            chatHistory.querySelectorAll('.history-item').forEach(h => h.classList.remove('active'));
            item.classList.add('active');
        });
        chatHistory.appendChild(item);
    });
}

// ======================== SCROLL ========================
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ======================== FOCUS INPUT ON LOAD ========================
userInput.focus();
