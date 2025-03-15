(function() {
  // Config validation
  if (!window.wiseowlConfig || !window.wiseowlConfig.botId) {
    console.error('WiseOwl: Configuration missing. Please add window.wiseowlConfig with botId.');
    return;
  }
console.log(window.wiseowlConfig);

  // Load styles
  const loadStyles = () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${window.wiseowlConfig.url}/cdn/styles.css`;
    document.head.appendChild(link);
  };

  // Fetch bot info
  const getBotInfo = async (botId) => {
    const response = await fetch(`${window.wiseowlConfig.url}/api/bot/get-info?botId=${botId}`);
    if (response.ok) {
      const { bot } = await response.json();
      return bot;
    }
    throw new Error('Failed to fetch bot info');
  };

  // Create chat UI
  const createChatUI = (botName, primaryColor) => {
    const widget = document.createElement('div');
    widget.className = 'wiseowl-widget';

    console.log("fuck");
    

    // Chat button
    const button = document.createElement('button');
    button.className = 'wiseowl-button';
    button.setAttribute('aria-label', 'Open chat');
    button.innerHTML = `
      <div class="wiseowl-avatar" style="background-color: ${primaryColor}">
        ${botName.charAt(0).toUpperCase()}
      </div>
    `;

    // Chat window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'wiseowl-chat-window';
    chatWindow.innerHTML = `
      <div class="wiseowl-chat-header" style="background-color: ${primaryColor}">
        <h3>${botName}</h3>
        <button class="wiseowl-close-button" aria-label="Close chat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="wiseowl-chat-messages"></div>
      <form class="wiseowl-chat-input">
        <textarea placeholder="Type your message..." rows="1" maxlength="1000"></textarea>
        <button type="submit" aria-label="Send message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </form>
    `;

    // Add elements to widget
    widget.appendChild(button);
    widget.appendChild(chatWindow);
    document.body.appendChild(widget);

    // Event listeners
    button.addEventListener('click', () => {
      chatWindow.classList.add('open');
      button.style.display = 'none';
      chatWindow.querySelector('textarea').focus();
    });

    const closeButton = chatWindow.querySelector('.wiseowl-close-button');
    closeButton.addEventListener('click', () => {
      chatWindow.classList.remove('open');
      button.style.display = 'flex';
    });
  };

  // Initialize
  const init = async () => {
    try {
      
      const { botId } = window.wiseowlConfig;
      console.log('Initializing WiseOwl chatbot:', botId);
      loadStyles();
      const botInfo = await getBotInfo(botId);
      console.log(botInfo);
      console.log(window.wiseowlConfig);
      
      createChatUI(botInfo.name, botInfo.color);
    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  // Start initialization
  init();
})();
