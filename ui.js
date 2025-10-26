export class UIManager {
  constructor(onSendMessage, onChangeCharacter) {
    this.onSendMessage = onSendMessage;
    this.onChangeCharacter = onChangeCharacter;
    this.isMobile = false;
    this.onBuildClick = null;
    this.onDiscoverClick = null;
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
    const buttons = document.querySelectorAll('.game-btn');
    buttons.forEach(button => {
      const buttonType = this.getButtonType(button);
      button.addEventListener('click', () => this.handleButtonClick(buttonType, button));
    });
    const chatInput = document.querySelector('.chat-input');
    if (chatInput) chatInput.addEventListener('click', () => this.handleChatClick());
    const charButtons = document.querySelectorAll('.char-btn');
    charButtons.forEach(button => {
      button.addEventListener('click', () => {
        const modelType = button.dataset.model;
        if (this.onChangeCharacter) {
          this.onChangeCharacter(modelType);
          this.showMessage('Zmieniono postać!', 'success');
        }
      });
    });
  }

  getButtonType(button) {
    if (button.classList.contains('btn-zagraj')) return 'zagraj';
    if (button.classList.contains('btn-buduj')) return 'buduj';
    if (button.classList.contains('btn-kup')) return 'kup';
    if (button.classList.contains('btn-odkryj')) return 'odkryj';
    if (button.classList.contains('btn-wiecej')) return 'wiecej';
    return 'unknown';
  }

  handleButtonClick(buttonType, buttonElement) {
    buttonElement.style.transform = 'translateY(-1px) scale(0.95)';
    setTimeout(() => { buttonElement.style.transform = ''; }, 150);
    if (buttonType === 'buduj' && this.onBuildClick) { this.showMessage('Wchodzenie do trybu budowania...', 'info'); this.onBuildClick(); return; }
    if (buttonType === 'odkryj' && this.onDiscoverClick) { this.onDiscoverClick(); return; }
    switch (buttonType) {
      case 'zagraj': this.showMessage('Otwieranie trybu gier...', 'success'); break;
      case 'kup': this.showMessage('Otwieranie sklepu...', 'success'); break;
      case 'wiecej': this.showMessage('Więcej opcji...', 'info'); break;
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