export class UIManager {
  constructor(onSendMessage) {
    this.onSendMessage = onSendMessage;
    this.isMobile = false;
    this.onBuildClick = null;
    this.onDiscoverClick = null;
    this.onPlayClick = null;
    this.onSkinBuilderClick = null;
  }
  
  initialize(isMobile) {
    this.isMobile = isMobile;
    this.setupButtonHandlers();
    this.setupChatSystem();
    console.log('UI Manager initialized');
  }
  
  updateCoinCounter(amount) {
    const coinValueElement = document.getElementById('coin-value');
    if (coinValueElement) {
      coinValueElement.textContent = amount;
    }
  }

  toggleMobileControls(showMobile) {
    const mobileControlsDiv = document.getElementById('mobile-game-controls');
    if(mobileControlsDiv) mobileControlsDiv.style.display = showMobile ? 'block' : 'none';
  }

  setupButtonHandlers() {
    // Główne przyciski interfejsu
    const buttons = document.querySelectorAll('.game-btn');
    buttons.forEach(button => {
      const buttonType = this.getButtonType(button);
      button.addEventListener('click', () => this.handleButtonClick(buttonType, button));
    });

    // Czat
    const chatInput = document.querySelector('.chat-input');
    if (chatInput) chatInput.addEventListener('click', () => this.handleChatClick());

    // --- POPRAWKA: Logika dla nowego panelu wyboru budowania ---
    const buildChoicePanel = document.getElementById('build-choice-panel');
    const buildChoiceWorldBtn = document.getElementById('build-choice-world');
    const buildChoiceSkinBtn = document.getElementById('build-choice-skin');
    const buildChoiceCloseBtn = document.getElementById('build-choice-close');

    if (buildChoiceWorldBtn) {
      buildChoiceWorldBtn.onclick = () => {
        buildChoicePanel.style.display = 'none';
        if (this.onBuildClick) this.onBuildClick();
      };
    }
    if (buildChoiceSkinBtn) {
      buildChoiceSkinBtn.onclick = () => {
        buildChoicePanel.style.display = 'none';
        if (this.onSkinBuilderClick) this.onSkinBuilderClick();
      };
    }
    if (buildChoiceCloseBtn) {
      buildChoiceCloseBtn.onclick = () => {
        buildChoicePanel.style.display = 'none';
      };
    }
  }

  getButtonType(button) {
    if (button.classList.contains('btn-zagraj')) return 'zagraj';
    if (button.classList.contains('btn-buduj')) return 'buduj';
    if (button.classList.contains('btn-kup')) return 'kup';
    if (button.classList.contains('btn-odkryj')) return 'odkryj';
    if (button.classList.contains('btn-wiecej')) return 'wiecej'; // Nowy przycisk
    return 'unknown';
  }

  handleButtonClick(buttonType, buttonElement) {
    buttonElement.style.transform = 'translateY(-1px) scale(0.95)';
    setTimeout(() => { buttonElement.style.transform = ''; }, 150);

    // --- POPRAWKA: Nowa logika przycisków ---
    if (buttonType === 'zagraj' && this.onPlayClick) {
        this.onPlayClick();
        return;
    }
    if (buttonType === 'buduj') {
        // Zamiast budować, pokazujemy panel wyboru
        const panel = document.getElementById('build-choice-panel');
        if (panel) panel.style.display = 'flex';
        return;
    }
    if (buttonType === 'odkryj' && this.onDiscoverClick) {
        // Przycisk "Odkryj" teraz pokazuje skiny
        this.onDiscoverClick();
        return;
    }
    
    // Pozostałe przyciski
    switch (buttonType) {
      case 'kup': 
        this.showMessage('Otwieranie sklepu...', 'success'); 
        break;
      case 'wiecej':
        this.showMessage('Więcej opcji...', 'info');
        break;
    }
  }

  setupChatSystem() {
    this.setupChatInput();
  }
  
  addChatMessage(message) {
    const chatArea = document.querySelector('.chat-area');
    if (!chatArea) return;
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.textContent = message;
    chatArea.appendChild(messageElement);
    if (chatArea.children.length > 6) chatArea.removeChild(chatArea.children[0]);
    chatArea.scrollTop = chatArea.scrollHeight;
  }
  
  handleChatClick() {
    const chatForm = document.getElementById('chat-form');
    if(chatForm) chatForm.style.display = 'flex';
    const chatInput = document.getElementById('chat-input-field');
    if(chatInput) chatInput.focus();
  }
  
  setupChatInput() {
    const chatForm = document.getElementById('chat-form');
    if(!chatForm) return;
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const chatInput = document.getElementById('chat-input-field');
      const message = chatInput.value.trim();
      if (message && this.onSendMessage) {
        this.onSendMessage(message);
        this.addChatMessage(`Ty: ${message}`);
      }
      chatInput.value = '';
      chatForm.style.display = 'none';
    });
  }
  
  showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${type === 'success' ? '#27ae60' : '#3498db'}; color: white; padding: 15px 25px; border-radius: 10px; font-weight: bold; z-index: 10000; box-shadow: 0 6px 12px rgba(0,0,0,0.4); opacity: 0; transition: all 0.3s ease;`;
    messageDiv.textContent = text;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
      messageDiv.style.opacity = '1';
      messageDiv.style.transform = 'translate(-50%, -50%) translateY(-10px)';
    }, 10);
    setTimeout(() => {
      messageDiv.style.opacity = '0';
      setTimeout(() => { if (messageDiv.parentNode) messageDiv.parentNode.removeChild(messageDiv); }, 300);
    }, 2500);
  }
}
