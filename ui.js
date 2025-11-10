export class UIManager {
  constructor(onSendMessage) {
    this.onSendMessage = onSendMessage;
    this.isMobile = false;
    this.onWorldSizeSelected = null;
    this.onSkinBuilderClick = null;
    this.onPrefabBuilderClick = null;
    this.onPartBuilderClick = null;
    this.onDiscoverClick = null;
    this.onPlayClick = null;
    this.onPlayerAvatarClick = null;
    this.onToggleFPS = null;
    this.onShopOpen = null;
    this.onBuyBlock = null;
    this.onNameSubmit = null;
  }
  
  initialize(isMobile) {
    this.isMobile = isMobile;
    this.setupButtonHandlers();
    this.setupChatSystem();
    console.log('UI Manager initialized');
  }
  
  updateFPSToggleText(isEnabled) {
    const fpsStatus = document.getElementById('fps-status');
    if (fpsStatus) {
      fpsStatus.textContent = isEnabled ? 'Włączony' : 'Wyłączony';
    }
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
    // Zamykanie wszystkich paneli
    document.querySelectorAll('.panel-close-button').forEach(btn => {
        btn.closest('.panel-modal').style.cursor = 'pointer';
        btn.onclick = (e) => {
            e.stopPropagation();
            btn.closest('.panel-modal').style.display = 'none';
        };
        // Zamykanie po kliknięciu tła
        btn.closest('.panel-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.style.display = 'none';
            }
        });
        // Zapobieganie zamykaniu po kliknięciu w zawartość
        btn.closest('.panel-content').addEventListener('click', (e) => e.stopPropagation());
    });

    // Główne przyciski
    document.querySelectorAll('.game-btn').forEach(button => {
      const buttonType = this.getButtonType(button);
      button.addEventListener('click', () => this.handleButtonClick(buttonType, button));
    });

    // Inne przyciski
    const playerBtn = document.getElementById('player-avatar-button');
    if (playerBtn) playerBtn.onclick = () => { document.getElementById('player-preview-panel').style.display = 'flex'; if (this.onPlayerAvatarClick) this.onPlayerAvatarClick(); };

    const chatToggle = document.getElementById('chat-toggle-button');
    if (chatToggle) chatToggle.addEventListener('click', () => this.handleChatClick());

    // Przyciski wyboru budowy
    const newWorldBtn = document.getElementById('build-choice-new-world');
    const newSkinBtn = document.getElementById('build-choice-new-skin');
    const newPrefabBtn = document.getElementById('build-choice-new-prefab');
    const newPartBtn = document.getElementById('build-choice-new-part');
    
    if (newWorldBtn) newWorldBtn.onclick = () => { 
        document.getElementById('build-choice-panel').style.display = 'none'; 
        document.getElementById('world-size-panel').style.display = 'flex';
    };
    if (newSkinBtn) newSkinBtn.onclick = () => { 
        document.getElementById('build-choice-panel').style.display = 'none'; 
        if (this.onSkinBuilderClick) this.onSkinBuilderClick(); 
    };
    if (newPrefabBtn) newPrefabBtn.onclick = () => {
        document.getElementById('build-choice-panel').style.display = 'none';
        if (this.onPrefabBuilderClick) this.onPrefabBuilderClick();
    };
    if (newPartBtn) newPartBtn.onclick = () => {
        document.getElementById('build-choice-panel').style.display = 'none';
        if (this.onPartBuilderClick) this.onPartBuilderClick();
    };

    // Przyciski wyboru rozmiaru świata
    const sizeNewSmallBtn = document.getElementById('size-choice-new-small');
    const sizeNewMediumBtn = document.getElementById('size-choice-new-medium');
    const sizeNewLargeBtn = document.getElementById('size-choice-new-large');

    if (sizeNewSmallBtn) sizeNewSmallBtn.onclick = () => { document.getElementById('world-size-panel').style.display = 'none'; if (this.onWorldSizeSelected) this.onWorldSizeSelected(64); };
    if (sizeNewMediumBtn) sizeNewMediumBtn.onclick = () => { document.getElementById('world-size-panel').style.display = 'none'; if (this.onWorldSizeSelected) this.onWorldSizeSelected(128); };
    if (sizeNewLargeBtn) sizeNewLargeBtn.onclick = () => { document.getElementById('world-size-panel').style.display = 'none'; if (this.onWorldSizeSelected) this.onWorldSizeSelected(256); };

    // Inne
    const toggleFPSBtn = document.getElementById('toggle-fps-btn');
    if (toggleFPSBtn) toggleFPSBtn.onclick = () => { if(this.onToggleFPS) this.onToggleFPS(); };

    const nameInputPanel = document.getElementById('name-input-panel');
    const nameInputField = document.getElementById('name-input-field');
    const nameSubmitBtn = document.getElementById('name-submit-btn');

    if (nameSubmitBtn) {
        nameSubmitBtn.onclick = () => {
            const name = nameInputField.value.trim();
            if (name && this.onNameSubmit) {
                this.onNameSubmit(name);
                nameInputPanel.style.display = 'none';
            } else {
                alert('Nazwa nie może być pusta!');
            }
        };
    }
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

    if (buttonType === 'zagraj') { document.getElementById('discover-panel').style.display = 'flex'; if (this.onPlayClick) this.onPlayClick(); return; }
    if (buttonType === 'buduj') { document.getElementById('build-choice-panel').style.display = 'flex'; return; }
    if (buttonType === 'odkryj') { document.getElementById('discover-panel').style.display = 'flex'; if (this.onDiscoverClick) this.onDiscoverClick(); return; }
    if (buttonType === 'wiecej') { document.getElementById('more-options-panel').style.display = 'flex'; return; }
    if (buttonType === 'kup') { document.getElementById('shop-panel').style.display = 'flex'; if (this.onShopOpen) this.onShopOpen(); return; }
  }

  populateShop(allBlocks, isOwnedCallback) {
    const shopList = document.getElementById('shop-list');
    if (!shopList) return;
    shopList.innerHTML = '';

    allBlocks.forEach(block => {
        const item = document.createElement('div');
        item.className = 'shop-item';

        const isOwned = isOwnedCallback(block.name);

        item.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-icon" style="background-image: url('${block.texturePath}')"></div>
                <span class="shop-item-name text-outline">${block.name}</span>
            </div>
            <div class="shop-item-action">
                ${isOwned 
                    ? `<span class="owned-label text-outline">Posiadane</span>` 
                    : `<button class="buy-btn" data-block-name="${block.name}">${block.cost} 🪙</button>`
                }
            </div>
        `;
        shopList.appendChild(item);
    });

    shopList.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = () => {
            const blockName = btn.dataset.blockName;
            const blockToBuy = allBlocks.find(b => b.name === blockName);
            if (blockToBuy && this.onBuyBlock) {
                this.onBuyBlock(blockToBuy);
            }
        };
    });
  }

  setupChatSystem() { this.setupChatInput(); }
  
  addChatMessage(message) {
    const chatArea = document.querySelector('.chat-area');
    if (!chatArea) return;
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message text-outline';
    messageElement.textContent = message;
    chatArea.appendChild(messageElement);
    
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
    messageDiv.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${type === 'success' ? '#27ae60' : (type === 'error' ? '#e74c3c' : '#3498db')}; color: white; padding: 15px 25px; border-radius: 10px; font-weight: bold; z-index: 10000; box-shadow: 0 6px 12px rgba(0,0,0,0.4); opacity: 0; transition: all 0.3s ease;`;
    messageDiv.classList.add('text-outline');
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
