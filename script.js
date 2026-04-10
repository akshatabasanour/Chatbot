document.addEventListener('DOMContentLoaded', () => {
    const queryInput = document.getElementById('query-input');
    const submitBtn = document.getElementById('submit-btn');
    const outputArea = document.getElementById('output-area');

    async function executeQuery() {
        const query = queryInput.value.trim();
        if (query === "") return;

        // Reset output
        outputArea.innerHTML = '';
        const typingIndicator = document.createElement('span');
        typingIndicator.textContent = 'Thinking...';
        typingIndicator.style.opacity = '0.5';
        outputArea.appendChild(typingIndicator);

        // Check for API key (using prompt for demo if not using server)
        let apiKey = localStorage.getItem('openrouter_key');
        if (!apiKey) {
            apiKey = prompt("Please enter your OpenRouter API Key (this will be saved to your browser session to enable chat):");
            if (apiKey) localStorage.setItem('openrouter_key', apiKey);
        }

        if (!apiKey) {
            typingIndicator.textContent = "Error: OpenRouter API key required to enable AI chat.";
            return;
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.origin, // Required for some OpenRouter models
                    'X-Title': 'Premium Silver Chat',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4.1-mini', // GPT-4.1 Mini
                    messages: [{ role: 'user', content: query }],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const aiMessage = data.choices?.[0]?.message?.content || "No response received.";
            outputArea.innerHTML = '';
            typeEffect(aiMessage, outputArea);
        } catch (error) {
            outputArea.innerHTML = '';
            typeEffect(`Error: ${error.message}`, outputArea);
            console.error("OpenRouter Error:", error);
        }

        queryInput.value = '';
    }

    function typeEffect(text, element) {
        let i = 0;
        const typingSpan = document.createElement('span');
        typingSpan.classList.add('typing');
        element.appendChild(typingSpan);

        function type() {
            if (i < text.length) {
                typingSpan.textContent += text.charAt(i);
                i++;
                setTimeout(type, 30);
                
                // Keep scrolled to bottom
                element.scrollTop = element.scrollHeight;
            }
        }
        type();
    }

    submitBtn.addEventListener('click', executeQuery);

    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeQuery();
        }
    });

    // Initial greeting
    setTimeout(() => {
        typeEffect('Welcome. Type your query below to begin.', outputArea);
    }, 500);
});
