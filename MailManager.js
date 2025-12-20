import { API_BASE_URL, STORAGE_KEYS } from './Config.js';

const TEMPLATE = `
    <style>
        .mail-wrapper {
            width: 85vw; max-width: 600px; height: 70vh;
            background-color: #74b9ff;
            border-radius: 10px;
            display: flex; flex-direction: column; overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 4px solid white;
            font-family: 'Titan One', sans-serif;
            position: relative;
        }

        /* INBOX HEADER */
        .mail-header {
            background: linear-gradient(to bottom, #3498db, #2980b9);
            height: 50px;
            display: flex; align-items: center; justify-content: center;
            position: relative; border-bottom: 3px solid rgba(0,0,0,0.2);
            color: white; font-size: 24px; text-shadow: 2px 2px 0 #000;
        }
        .mail-header-btn-new {
            position: absolute; right: 10px; top: 5px;
            width: 40px; height: 40px;
            background: #2ecc71; border: 2px solid white; border-radius: 8px;
            display: flex; justify-content: center; align-items: center;
            font-size: 24px; cursor: pointer;
            box-shadow: 0 4px 0 #27ae60;
        }
        .mail-header-btn-new:active { transform: translateY(3px); box-shadow: 0 1px 0 #27ae60; }

        /* INBOX LIST */
        .mail-inbox-list {
            flex: 1; overflow-y: auto;
            background-color: #81ecec;
            display: flex; flex-direction: column;
        }
        .mail-inbox-item {
            display: flex; height: 70px;
            background-color: #82ccdd;
            border-bottom: 2px solid #60a3bc;
            cursor: pointer; position: relative;
        }
        .mail-inbox-item:nth-child(even) { background-color: #6a89cc; }
        
        .mail-item-avatar {
            width: 70px; height: 100%;
            background-color: white; border-right: 2px solid #555;
            background-size: cover; background-position: center;
        }
        .mail-item-content {
            flex: 1; padding: 5px 10px; display: flex; flex-direction: column; justify-content: center;
        }
        .mail-item-user { color: white; font-size: 16px; text-shadow: 1px 1px 0 #000; }
        .mail-item-preview { color: #eee; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mail-item-time { 
            position: absolute; bottom: 5px; right: 5px; 
            font-size: 10px; color: #dfe6e9; 
        }

        /* CHAT VIEW HEADER */
        .chat-header {
            background: linear-gradient(to bottom, #74b9ff, #0984e3);
            height: 60px; display: flex; align-items: center;
            padding: 0 10px; gap: 10px; border-bottom: 4px solid rgba(0,0,0,0.2);
        }
        .chat-btn-back {
            width: 45px; height: 45px;
            background-color: #e74c3c; border: 2px solid white; border-radius: 8px;
            background-image: url('icons/icon-back.png'); background-size: 60%; background-repeat: no-repeat; background-position: center;
            box-shadow: 0 4px 0 #c0392b; cursor: pointer;
        }
        .chat-btn-back:active { transform: translateY(3px); box-shadow: none; }
        
        .chat-header-user-bar {
            flex: 1; height: 40px;
            background-color: #2ecc71; border: 2px solid white; border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 18px; text-shadow: 1.5px 1.5px 0 #000;
            box-shadow: 0 3px 0 #27ae60;
        }

        /* CHAT MESSAGES AREA */
        .chat-messages-area {
            flex: 1; overflow-y: auto; padding: 15px;
            background-color: #ecf0f1;
            display: flex; flex-direction: column; gap: 15px;
        }

        .chat-msg-row { display: flex; width: 100%; align-items: flex-end; gap: 10px; }
        .chat-msg-row.sent { justify-content: flex-end; }
        .chat-msg-row.received { justify-content: flex-start; }

        .chat-avatar-small {
            width: 40px; height: 40px; background-color: #bdc3c7; border: 2px solid white;
            background-size: cover; border-radius: 4px;
        }

        .chat-bubble {
            max-width: 70%; padding: 10px 15px;
            font-size: 14px; position: relative;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .chat-msg-row.received .chat-bubble {
            background-color: white; color: #3498db;
            border-radius: 15px 15px 15px 0;
        }

        .chat-msg-row.sent .chat-bubble {
            background-color: #3498db; color: white;
            border-radius: 15px 15px 0 15px;
        }

        /* FOOTER INPUT */
        .chat-footer {
            height: 60px; background-color: #3498db;
            display: flex; align-items: center; padding: 0 10px; gap: 10px;
            border-top: 3px solid white;
        }
        .chat-input {
            flex: 1; height: 40px;
            border: 2px solid #bdc3c7; border-radius: 5px;
            padding: 0 10px; font-family: inherit; font-size: 16px;
        }
        .chat-btn-send {
            width: 50px; height: 50px;
            background-color: #2ecc71; border: 2px solid white; border-radius: 8px;
            display: flex; justify-content: center; align-items: center;
            font-size: 24px; color: white; cursor: pointer;
            box-shadow: 0 4px 0 #27ae60;
        }
        .chat-btn-send:active { transform: translateY(3px); box-shadow: none; }
        
        .hidden { display: none !important; }
    </style>

    <div id="mail-panel" class="panel-modal" style="display:none;">
        <div class="mail-wrapper">
            
            <!-- WIDOK 1: LISTA (INBOX) -->
            <div id="mail-inbox-view" style="display: flex; flex-direction: column; height: 100%;">
                <div class="mail-header">
                    <span>Poczta</span>
                    <div id="btn-mail-compose" class="mail-header-btn-new">+</div>
                </div>
                <div id="mail-inbox-list" class="mail-inbox-list"></div>
                <button id="btn-mail-close-main" class="panel-close-button" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); z-index: 10;">Zamknij</button>
            </div>

            <!-- WIDOK 2: KONWERSACJA (CHAT) -->
            <div id="mail-conversation-view" class="hidden" style="flex-direction: column; height: 100%;">
                <div class="chat-header">
                    <div id="btn-mail-back" class="chat-btn-back"></div>
                    <div id="mail-chat-username" class="chat-header-user-bar">Nazwa Gracza</div>
                </div>
                <div id="mail-chat-messages" class="chat-messages-area"></div>
                <div class="chat-footer">
                    <input id="mail-reply-input" class="chat-input" placeholder="Napisz wiadomość...">
                    <div id="mail-reply-btn" class="chat-btn-send">✔</div>
                </div>
            </div>

            <!-- WIDOK 3: NOWA WIADOMOŚĆ (COMPOSER) -->
            <div id="new-mail-composer" class="hidden" style="flex-direction: column; height: 100%; background: #3498db; padding: 20px; color: white;">
                 <h2 class="text-outline">Nowa wiadomość</h2>
                 <input id="new-mail-recipient" class="chat-input" placeholder="Do kogo?" style="margin-bottom: 10px;">
                 <textarea id="new-mail-text" class="chat-input" style="height: 100px; padding-top: 10px;" placeholder="Treść"></textarea>
                 <div style="display:flex; gap: 10px; margin-top: 20px;">
                    <button id="btn-send-new" class="btn-claim-all" style="flex:1; background: #2ecc71; border: 2px solid white; color: white; padding: 10px; border-radius: 8px;">Wyślij</button>
                    <button id="btn-cancel-new" class="panel-close-button" style="margin:0; flex:1;">Anuluj</button>
                 </div>
            </div>

        </div>
    </div>
`;

export class MailManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.activeConversation = null;
    }

    initialize() {
        const modalsLayer = document.getElementById('modals-layer');
        if (modalsLayer) {
            modalsLayer.insertAdjacentHTML('beforeend', TEMPLATE);
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Otwieranie nowej wiadomości
        const btnCompose = document.getElementById('btn-mail-compose');
        if(btnCompose) {
            btnCompose.onclick = () => {
                this.switchView('composer');
            };
        }

        // Zamknięcie całego panelu
        const btnClose = document.getElementById('btn-mail-close-main');
        if (btnClose) {
            btnClose.onclick = () => this.close();
        }

        // Wstecz z czatu do listy
        const btnBack = document.getElementById('btn-mail-back');
        if(btnBack) {
            btnBack.onclick = () => {
                this.switchView('inbox');
                this.loadMailData(); 
            };
        }
        
        // Anuluj nową wiadomość
        const btnCancel = document.getElementById('btn-cancel-new');
        if(btnCancel) {
            btnCancel.onclick = () => {
                this.switchView('inbox');
            };
        }

        // Wyślij nową wiadomość
        const btnSendNew = document.getElementById('btn-send-new');
        if(btnSendNew) {
            btnSendNew.onclick = async () => {
                const recipient = document.getElementById('new-mail-recipient').value.trim();
                const text = document.getElementById('new-mail-text').value.trim();
                if(recipient && text) {
                    if (this.ui.onSendPrivateMessage) {
                        this.ui.onSendPrivateMessage(recipient, text);
                    }
                    this.switchView('inbox');
                    this.loadMailData();
                    document.getElementById('new-mail-recipient').value = '';
                    document.getElementById('new-mail-text').value = '';
                }
            };
        }

        // Wyślij odpowiedź (Reply)
        const btnReply = document.getElementById('mail-reply-btn');
        if(btnReply) {
            btnReply.onclick = async () => {
                this.sendReply();
            };
        }

        // Obsługa Enter w polu odpowiedzi
        const replyInput = document.getElementById('mail-reply-input');
        if (replyInput) {
            replyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendReply();
            });
        }
    }

    sendReply() {
        const input = document.getElementById('mail-reply-input');
        const text = input.value.trim();
        if(text && this.activeConversation && this.ui.onSendPrivateMessage) {
            this.ui.onSendPrivateMessage(this.activeConversation, text);
            input.value = '';
            
            // Optymistyczne dodanie dymka
            const container = document.getElementById('mail-chat-messages');
            const row = document.createElement('div');
            row.className = 'chat-msg-row sent';
            row.innerHTML = `<div class="chat-bubble">${text}</div><div class="chat-avatar-small" style="background-image: url('icons/avatar_placeholder.png');"></div>`;
            container.appendChild(row);
            container.scrollTop = container.scrollHeight;
        }
    }

    open() {
        const panel = document.getElementById('mail-panel');
        if (panel) {
            this.ui.bringToFront(panel);
            panel.style.display = 'flex';
            this.switchView('inbox');
            this.loadMailData();
        }
    }

    close() {
        const panel = document.getElementById('mail-panel');
        if (panel) panel.style.display = 'none';
    }

    switchView(viewName) {
        const inbox = document.getElementById('mail-inbox-view');
        const chat = document.getElementById('mail-conversation-view');
        const composer = document.getElementById('new-mail-composer');

        if(inbox) inbox.classList.add('hidden');
        if(chat) chat.classList.add('hidden');
        if(composer) composer.classList.add('hidden');

        if (viewName === 'inbox') {
            inbox.classList.remove('hidden');
        } else if (viewName === 'chat') {
            chat.classList.remove('hidden');
            chat.style.display = 'flex'; // Flex potrzebny dla układu
        } else if (viewName === 'composer') {
            composer.classList.remove('hidden');
            composer.style.display = 'flex';
        }
    }

    async loadMailData() {
        const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        if (!t) return;
        
        const inboxList = document.getElementById('mail-inbox-list');
        if (inboxList) inboxList.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px;">Ładowanie...</p>';
        
        try {
            const r = await fetch(`${API_BASE_URL}/api/messages`, { headers: { 'Authorization': `Bearer ${t}` } });
            const messages = await r.json();
            this.renderMailList(messages);
        } catch (e) {
            console.error(e);
            if (inboxList) inboxList.innerHTML = '<p class="text-outline" style="text-align:center; color:red;">Błąd.</p>';
        }
    }

    renderMailList(messages) {
        const list = document.getElementById('mail-inbox-list');
        if (!list) return;
        list.innerHTML = '';
        
        if (!messages || messages.length === 0) {
            list.innerHTML = '<p class="text-outline" style="text-align:center; padding:20px; color:#fff;">Skrzynka pusta.</p>';
            return;
        }
        
        messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'mail-inbox-item';
            
            const date = new Date(msg.created_at);
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            let timeStr = diffDays < 1 ? "dzisiaj" : `${diffDays} dni temu`;
            if (diffDays > 30) timeStr = `${Math.floor(diffDays/30)} mies. temu`;

            div.innerHTML = `
              <div class="mail-item-avatar" style="background-image: url('icons/avatar_placeholder.png');"></div>
              <div class="mail-item-content">
                  <div class="mail-item-user text-outline">${msg.other_username}</div>
                  <div class="mail-item-preview">${msg.message_text}</div>
              </div>
              <div class="mail-item-time text-outline">${timeStr}</div>
            `;
            
            div.onclick = () => { this.openConversation(msg.other_username); };
            list.appendChild(div);
        });
    }

    async openConversation(username) {
        this.activeConversation = username;
        this.switchView('chat');

        const headerName = document.getElementById('mail-chat-username');
        if(headerName) headerName.textContent = username;

        const msgsContainer = document.getElementById('mail-chat-messages');
        if(msgsContainer) msgsContainer.innerHTML = '<p style="text-align:center; padding:20px;">Pobieranie...</p>';

        const t = localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
        try {
            const r = await fetch(`${API_BASE_URL}/api/messages/${username}`, { headers: { 'Authorization': `Bearer ${t}` } });
            const history = await r.json();
            this.renderChatHistory(history);
        } catch (e) { console.error(e); }
    }

    renderChatHistory(history) {
        const container = document.getElementById('mail-chat-messages');
        if (!container) return;
        container.innerHTML = '';
        
        const myName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
        
        history.forEach(msg => {
            const isMine = msg.sender_username === myName;
            
            const row = document.createElement('div');
            row.className = `chat-msg-row ${isMine ? 'sent' : 'received'}`;
            
            const avatar = `<div class="chat-avatar-small" style="background-image: url('icons/avatar_placeholder.png');"></div>`;
            const bubble = `<div class="chat-bubble">${msg.message_text}</div>`;
            
            if(isMine) {
                row.innerHTML = bubble + avatar;
            } else {
                row.innerHTML = avatar + bubble;
            }
            
            container.appendChild(row);
        });
        container.scrollTop = container.scrollHeight;
    }
}