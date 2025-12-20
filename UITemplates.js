export const AUTH_HTML = `
    <div id="auth-screen">
        <div class="auth-container">
            <div id="welcome-view">
                <button id="show-login-btn" class="btn-secondary text-outline">Zaloguj się</button>
                <button id="show-register-btn" class="btn-primary text-outline">Nowy Użytkownik</button>
            </div>
            <form id="login-form" class="auth-form">
                <h2 class="text-outline">Zaloguj</h2>
                <input type="text" id="login-username" placeholder="Wprowadź nick" required autocomplete="username">
                <input type="password" id="login-password" placeholder="Wprowadź hasło" required autocomplete="current-password">
                <button type="submit" class="btn-primary text-outline">Ok</button>
                <button type="button" class="btn-back text-outline">Anuluj</button>
            </form>
            <form id="register-form" class="auth-form">
                <h2 class="text-outline">Nowy Użytkownik</h2>
                <input type="text" id="register-username" placeholder="Wprowadź nick" required minlength="3" maxlength="15">
                <input type="password" id="register-password" placeholder="Wprowadź hasło" required minlength="6">
                <input type="password" id="register-password-confirm" placeholder="Powtórz hasło" required>
                <button type="submit" class="btn-primary text-outline">Ok</button>
                <button type="button" class="btn-back text-outline">Anuluj</button>
            </form>
            <div id="auth-message" class="text-outline"></div>
        </div>
    </div>
`;

export const HUD_HTML = `
    <div class="top-bar ui-element">
        <div id="player-avatar-button" class="top-bar-item"><div class="player-avatar">👤</div><div class="player-name text-outline" id="player-name-display">player</div></div>
        <div class="top-bar-item"><div class="player-avatar" style="background-image: url('icons/logo-poczta.png'); background-size: 75%; background-position: center; background-repeat: no-repeat; background-color: transparent;"></div><div class="player-name text-outline">Poczta</div></div>
        <div id="btn-friends-open" class="top-bar-item"><div class="player-avatar btn-friends" style="background-image: url('icons/icon-friends.png'); background-size: 75%; background-position: center; background-repeat: no-repeat; background-color: #e67e22;"></div><div class="player-name text-outline">Przyjaciele</div></div>
        <div id="active-friends-container"></div>
    </div>
    <div id="parkour-timer" class="text-outline">00:00.00</div>
    <div class="chat-container ui-element"><div class="chat-area"></div><div id="chat-toggle-button">💬</div></div>
    <form id="chat-form" class="ui-element"><input type="text" id="chat-input-field" placeholder="Napisz coś..."><button type="submit" id="chat-send-btn">Wyślij</button></form>
    
    <div class="right-ui ui-element">
        <div class="game-buttons">
            <button class="game-btn btn-zagraj"></button>
            <button class="game-btn btn-buduj"></button>
            <button class="game-btn btn-kup"></button>
            <button class="game-btn btn-odkryj"></button>
            <button class="game-btn btn-wiecej"></button>
        </div>
        <div id="level-container">
            <div class="level-star"><div id="level-value" class="text-outline">1</div></div>
            <div class="level-bar-background"><div id="level-bar-fill"></div><div id="level-text" class="text-outline">0/50</div></div>
            <div class="level-plus-btn">+</div>
        </div>
        <div id="coin-counter"><div class="coin-icon"></div><div class="coin-bar-background"><div id="coin-value" class="text-outline">0</div></div><div id="coin-add-btn" class="ui-element">+</div></div>
    </div>
    <div id="mobile-game-controls"><div id="joystick-zone"></div><button id="jump-button"></button></div>
`;

export const BUILD_UI_HTML = `
    <div id="build-exit-button" class="build-ui-button"></div>
    <div id="build-save-button" class="build-ui-button">Zapisz</div>
    <div id="build-mode-button" class="build-ui-button">Łatwy</div>
    <div id="build-add-button" class="build-ui-button">+</div>
    <div id="build-tools-right">
        <div id="tool-single" class="tool-btn active">⬜</div>
        <div id="tool-line" class="tool-btn">📏</div>
    </div>
    <div id="build-rotate-zone"><div class="rotate-icon">🔄</div></div>
    <div id="block-selection-panel">
        <div class="friends-tabs">
            <div class="friends-tab active" id="build-tab-blocks">Bloki</div>
            <div class="friends-tab" id="build-tab-addons">Dodatki</div>
        </div>
        <div id="build-block-list"></div>
    </div>
    <div id="prefab-selection-panel"></div>
    <div id="part-selection-panel"></div>
`;

export const SKIN_DETAILS_HTML = `
    <div id="skin-details-modal" class="panel-modal" style="display:none;">
        <div class="panel-close-button" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: #e74c3c; width: 40px; height: 40px; display:flex; justify-content:center; align-items:center; font-weight:bold;">X</div>
        
        <div class="skin-col-left">
            <div class="skin-creator-box">
                <div class="skin-creator-avatar"></div>
                <div style="font-weight:bold; text-shadow: 1px 1px 0 #000;">Stworzony przez:</div>
                <div class="skin-creator-name text-outline" style="font-size: 16px; color: #f1c40f; margin: 5px 0;">Gracz</div>
                <div class="skin-time-info">16 dni temu</div>
                <div class="skin-creator-level"><span class="skin-creator-level-val text-outline">1</span></div>
            </div>
            <div class="skin-stats-box">
                <div class="skin-like-icon-big"></div>
                <div class="skin-likes-count text-outline">0</div>
            </div>
        </div>

        <div class="skin-col-center">
            <div class="skin-name-header text-outline">Nazwa Skina</div>
            <div id="skin-preview-canvas"></div>
        </div>

        <div class="skin-col-right">
            <div id="skin-btn-share" class="skin-action-btn"><div class="skin-btn-icon"></div><div class="skin-btn-label text-outline">Udostępnij</div></div>
            <div id="skin-btn-like" class="skin-action-btn"><div class="skin-btn-icon"></div><div class="skin-btn-label text-outline">Polub</div></div>
            <div id="skin-btn-comment" class="skin-action-btn"><div class="skin-btn-icon"></div><div class="skin-btn-label text-outline">0</div></div>
            
            <div id="skin-btn-use" class="skin-action-btn" style="display:none;">
                <div class="skin-btn-icon"></div>
                <div class="skin-btn-label text-outline">Użyj</div>
            </div>
        </div>
    </div>
`;

export const SKIN_COMMENTS_HTML = `
    <div id="skin-comments-panel" style="display:none;">
        <div class="panel-close-button" id="close-comments-btn" style="position: absolute; top: 10px; left: -50px; z-index: 10; background: #e74c3c; width: 40px; height: 40px; display:flex; justify-content:center; align-items:center; font-weight:bold;">X</div>
        <div class="comments-list-container"></div>
        <div class="comments-input-area">
            <input id="comment-input" type="text" placeholder="Napisz wiadomość...">
            <button id="comment-submit-btn">✔</button>
        </div>
    </div>
`;

export const DISCOVER_CHOICE_HTML = `
    <div id="discover-choice-panel" class="panel-modal">
        <div class="panel-content">
            <h2>Co dziś odkrywamy?</h2>
            <div class="build-choice-grid">
                <div id="discover-choice-skin" class="play-choice-item">
                    <div class="play-choice-icon" style="background-image: url('icons/icon-newhypercube.png'); background-size: 70%; background-repeat: no-repeat; background-position: center; background-color: #3498db;"></div>
                    <span class="play-choice-label text-outline">HyperCube</span>
                </div>
                <div id="discover-choice-part" class="play-choice-item">
                    <div class="play-choice-icon" style="background-image: url('icons/icon-newhypercubepart.png'); background-size: 70%; background-repeat: no-repeat; background-position: center; background-color: #e67e22;"></div>
                    <span class="play-choice-label text-outline">Części</span>
                </div>
                <div id="discover-choice-prefab" class="play-choice-item">
                    <div class="play-choice-icon" style="background-image: url('icons/icon-newprefab.png'); background-size: 70%; background-repeat: no-repeat; background-position: center; background-color: #9b59b6;"></div>
                    <span class="play-choice-label text-outline">Prefabrykaty</span>
                </div>
            </div>
            <button class="panel-close-button">Anuluj</button>
        </div>
    </div>
`;

export const NEWS_MODAL_HTML = `
    <style>
        .news-container { width: 85vw; max-width: 600px; height: 70vh; background-color: #e0e0e0; border-radius: 15px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 4px solid white; font-family: 'Titan One', cursive; }
        .news-header { background: linear-gradient(to bottom, #4facfe, #00f2fe); color: white; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .news-header-title { font-size: 20px; text-shadow: 2px 2px 0 #000; }
        .btn-claim-all { background: linear-gradient(to bottom, #2ecc71, #27ae60); border: 2px solid white; border-radius: 10px; padding: 8px 15px; color: white; cursor: pointer; font-family: inherit; box-shadow: 0 4px 0 #1e8449; font-size: 14px; text-shadow: 1px 1px 0 #000; transition: transform 0.1s; }
        .btn-claim-all:active { transform: translateY(3px); box-shadow: 0 1px 0 #1e8449; }
        #news-list { flex: 1; overflow-y: auto; padding: 15px; background-color: #bdc3c7; display: flex; flex-direction: column; gap: 12px; }
        .news-item { background-color: #a3e635; border-radius: 12px; display: flex; height: 90px; box-shadow: 0 4px 0 #86bf2b; border: 2px solid white; position: relative; overflow: hidden; }
        .news-icon-area { width: 70px; display: flex; justify-content: center; align-items: center; background: rgba(255,255,255,0.2); }
        .news-type-icon { font-size: 40px; color: white; filter: drop-shadow(2px 2px 0 #000); }
        .news-content-area { flex: 1; padding: 10px; display: flex; flex-direction: column; justify-content: center; color: white; text-shadow: 1px 1px 0 #000; }
        .news-text-main { font-size: 14px; margin-bottom: 5px; line-height: 1.2; }
        .news-sub-info { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .news-source-avatar { width: 24px; height: 24px; border-radius: 50%; background-color: #eee; background-size: cover; border: 1px solid white; }
        .news-action-area { width: 110px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px; background: rgba(0,0,0,0.1); padding: 5px; }
        .news-reward-val { color: #f1c40f; font-size: 16px; display: flex; align-items: center; gap: 4px; }
        .btn-claim-one { background: linear-gradient(to bottom, #2ecc71, #27ae60); border: 2px solid white; border-radius: 8px; padding: 5px 12px; color: white; cursor: pointer; font-family: inherit; font-size: 12px; box-shadow: 0 3px 0 #1e8449; text-shadow: 1px 1px 0 #000; }
        .btn-claim-one:active { transform: translateY(3px); box-shadow: none; }
        .news-footer { height: 70px; background: linear-gradient(to bottom, #3498db, #2980b9); color: white; display: flex; align-items: center; padding: 0 15px; gap: 15px; border-top: 3px solid white; }
        .footer-chest { width: 50px; height: 50px; background: url('icons/icon-shop.png') center/contain no-repeat; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3)); }
        .thumb-icon { width: 40px; height: 40px; background: url('icons/icon-like.png') center/contain no-repeat; filter: drop-shadow(2px 2px 0 rgba(0,0,0,0.5)); }
    </style>

    <div id="news-modal" class="panel-modal" style="display:none;">
        <div class="news-container">
            <div class="news-header">
                <span class="news-header-title">Twoje aktualności (<span id="news-count-header">0</span>)</span>
                <button id="btn-news-claim-all" class="btn-claim-all">Odbierz wszystkie!</button>
            </div>
            <div id="news-list"></div>
            <div class="news-footer">
                <div class="footer-chest"></div>
                <span class="text-outline" style="font-size: 13px; text-align: left; flex: 1; line-height: 1.2;">Namów innych graczy do korzystania z Twoich prefabrykatów i skórek</span>
                <button class="panel-close-button" style="margin: 0; padding: 8px 15px; background: #e74c3c; border: 2px solid white; box-shadow: 0 4px 0 #c0392b;">X</button>
            </div>
        </div>
    </div>
`;

export const MAIL_MODAL_HTML = `
    <style>
        .mail-wrapper { width: 85vw; max-width: 600px; height: 70vh; background-color: #74b9ff; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 4px solid white; font-family: 'Titan One', sans-serif; position: relative; }
        .mail-header { background: linear-gradient(to bottom, #3498db, #2980b9); height: 50px; display: flex; align-items: center; justify-content: center; position: relative; border-bottom: 3px solid rgba(0,0,0,0.2); color: white; font-size: 24px; text-shadow: 2px 2px 0 #000; }
        .mail-header-btn-new { position: absolute; right: 10px; top: 5px; width: 40px; height: 40px; background: #2ecc71; border: 2px solid white; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 24px; cursor: pointer; box-shadow: 0 4px 0 #27ae60; }
        .mail-header-btn-new:active { transform: translateY(3px); box-shadow: 0 1px 0 #27ae60; }
        .mail-inbox-list { flex: 1; overflow-y: auto; background-color: #81ecec; display: flex; flex-direction: column; }
        .mail-inbox-item { display: flex; height: 70px; background-color: #82ccdd; border-bottom: 2px solid #60a3bc; cursor: pointer; position: relative; }
        .mail-inbox-item:nth-child(even) { background-color: #6a89cc; }
        .mail-item-avatar { width: 70px; height: 100%; background-color: white; border-right: 2px solid #555; background-size: cover; background-position: center; }
        .mail-item-content { flex: 1; padding: 5px 10px; display: flex; flex-direction: column; justify-content: center; }
        .mail-item-user { color: white; font-size: 16px; text-shadow: 1px 1px 0 #000; }
        .mail-item-preview { color: #eee; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mail-item-time { position: absolute; bottom: 5px; right: 5px; font-size: 10px; color: #dfe6e9; }
        .chat-header { background: linear-gradient(to bottom, #74b9ff, #0984e3); height: 60px; display: flex; align-items: center; padding: 0 10px; gap: 10px; border-bottom: 4px solid rgba(0,0,0,0.2); }
        .chat-btn-back { width: 45px; height: 45px; background-color: #e74c3c; border: 2px solid white; border-radius: 8px; background-image: url('icons/icon-back.png'); background-size: 60%; background-repeat: no-repeat; background-position: center; box-shadow: 0 4px 0 #c0392b; cursor: pointer; }
        .chat-btn-back:active { transform: translateY(3px); box-shadow: none; }
        .chat-header-user-bar { flex: 1; height: 40px; background-color: #2ecc71; border: 2px solid white; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; text-shadow: 1.5px 1.5px 0 #000; box-shadow: 0 3px 0 #27ae60; }
        .chat-messages-area { flex: 1; overflow-y: auto; padding: 15px; background-color: #ecf0f1; display: flex; flex-direction: column; gap: 15px; }
        .chat-msg-row { display: flex; width: 100%; align-items: flex-end; gap: 10px; }
        .chat-msg-row.sent { justify-content: flex-end; }
        .chat-msg-row.received { justify-content: flex-start; }
        .chat-avatar-small { width: 40px; height: 40px; background-color: #bdc3c7; border: 2px solid white; background-size: cover; border-radius: 4px; }
        .chat-bubble { max-width: 70%; padding: 10px 15px; font-size: 14px; position: relative; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .chat-msg-row.received .chat-bubble { background-color: white; color: #3498db; border-radius: 15px 15px 15px 0; }
        .chat-msg-row.sent .chat-bubble { background-color: #3498db; color: white; border-radius: 15px 15px 0 15px; }
        .chat-footer { height: 60px; background-color: #3498db; display: flex; align-items: center; padding: 0 10px; gap: 10px; border-top: 3px solid white; }
        .chat-input { flex: 1; height: 40px; border: 2px solid #bdc3c7; border-radius: 5px; padding: 0 10px; font-family: inherit; font-size: 16px; }
        .chat-btn-send { width: 50px; height: 50px; background-color: #2ecc71; border: 2px solid white; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 24px; color: white; cursor: pointer; box-shadow: 0 4px 0 #27ae60; }
        .chat-btn-send:active { transform: translateY(3px); box-shadow: none; }
        .hidden { display: none !important; }
    </style>

    <div id="mail-panel" class="panel-modal" style="display:none;">
        <div class="mail-wrapper">
            <div id="mail-inbox-view" style="display: flex; flex-direction: column; height: 100%;">
                <div class="mail-header">
                    <span>Poczta</span>
                    <div id="btn-mail-compose" class="mail-header-btn-new">+</div>
                </div>
                <div id="mail-inbox-list" class="mail-inbox-list"></div>
                <button class="panel-close-button" style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); z-index: 10;">Zamknij</button>
            </div>
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
            <div id="new-mail-composer" class="hidden" style="flex-direction: column; height: 100%; background: #3498db; padding: 20px; color: white;">
                 <h2 class="text-outline">Nowa wiadomość</h2>
                 <input id="new-mail-recipient" class="chat-input" placeholder="Do kogo?" style="margin-bottom: 10px;">
                 <textarea id="new-mail-text" class="chat-input" style="height: 100px; padding-top: 10px;" placeholder="Treść"></textarea>
                 <div style="display:flex; gap: 10px; margin-top: 20px;">
                    <button id="btn-send-new" class="btn-claim-all" style="flex:1;">Wyślij</button>
                    <button id="btn-cancel-new" class="panel-close-button" style="margin:0; flex:1;">Anuluj</button>
                 </div>
            </div>
        </div>
    </div>
`;

export const FRIENDS_MODAL_HTML = `
    <style>
        #friends-panel .panel-content {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
        }

        .friends-full-container {
            width: 100%; height: 100%;
            background-color: #1e375a; 
            display: flex; flex-direction: column;
            position: relative;
            padding-top: 60px; 
        }

        .friends-nav-bar {
            background-color: #3498db;
            height: 60px;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 10px;
            border-bottom: 4px solid #2980b9;
        }
        
        .friends-back-btn {
            width: 50px; height: 50px;
            background: #e74c3c url('icons/icon-back.png') center/60% no-repeat;
            border: 2px solid white; border-radius: 10px;
            box-shadow: 0 4px 0 #c0392b; cursor: pointer;
            flex-shrink: 0; margin-right: 10px;
        }
        
        .friends-tabs-container {
            flex: 1; display: flex; gap: 5px; overflow-x: auto;
            align-items: center; height: 100%;
        }
        
        .friend-nav-tab {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center;
            width: 80px; height: 50px;
            cursor: pointer; opacity: 0.7;
            transition: opacity 0.2s;
        }
        .friend-nav-tab.active { opacity: 1.0; border-bottom: 4px solid white; }
        
        .tab-icon { width: 30px; height: 30px; background-size: contain; background-position: center; background-repeat: no-repeat; }
        .tab-label { font-size: 10px; color: white; text-align: center; text-shadow: 1px 1px 0 #000; font-weight: bold; white-space: nowrap; }

        .friends-content-area {
            flex: 1; overflow-y: auto; overflow-x: hidden;
            background-color: #1e375a;
            padding: 10px;
            position: relative;
        }

        .friends-section-header {
            color: #00cec9;
            font-size: 18px; margin: 15px 0 5px 10px;
            text-shadow: 1.5px 1.5px 0 #000;
            display: flex; align-items: center; gap: 10px;
        }
        .status-dot { width: 12px; height: 12px; border-radius: 50%; border: 1px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
        .status-dot.online { background: #2ecc71; }
        .status-dot.offline { background: #e74c3c; }

        .friends-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 10px;
            padding: 0 5px;
        }
        
        .friend-card {
            background-color: #54a0ff;
            border-radius: 8px;
            overflow: hidden;
            display: flex; flex-direction: column;
            position: relative;
            box-shadow: 0 4px 0 #2e86de;
            height: 120px;
            border: 2px solid #2e86de;
        }
        
        .friend-card-header {
            background-color: #2e86de;
            color: white; font-size: 11px; text-align: center;
            padding: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            font-weight: bold; text-shadow: 1px 1px 0 #000;
        }
        
        .friend-card-body {
            flex: 1; background-color: #54a0ff;
            background-image: url('icons/avatar_placeholder.png'); 
            background-size: cover; background-position: center;
            position: relative;
        }
        
        .vip-badge {
            position: absolute; top: 2px; right: 2px;
            width: 25px; height: 15px;
            background: url('icons/vip_badge.png') center/contain no-repeat; 
        }
        
        .add-friend-btn {
            position: absolute; bottom: 5px; right: 5px;
            width: 30px; height: 30px;
            background: #2ecc71 url('icons/icon-add-friend.png') center/60% no-repeat;
            border: 2px solid white; border-radius: 5px;
            box-shadow: 0 2px 0 #27ae60; cursor: pointer;
        }
        .add-friend-btn:active { transform: translateY(2px); box-shadow: none; }
        
        .search-bar-container {
            display: flex; gap: 5px; padding: 10px;
            background-color: #2e86de;
            align-items: center;
        }
        .search-input {
            flex: 1; height: 35px; border-radius: 5px; border: none; padding: 0 10px;
            font-family: inherit;
        }
        .search-btn {
            width: 40px; height: 35px; background: #3498db url('icons/szukaj.png') center/60% no-repeat;
            border-radius: 5px; border: 2px solid white; cursor: pointer;
        }
        .clear-btn {
            height: 35px; padding: 0 10px; background: #74b9ff; color: white;
            border-radius: 5px; border: 2px solid white; cursor: pointer; font-weight: bold; text-shadow: 1px 1px 0 #000;
        }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
    </style>

    <div id="friends-panel" class="panel-modal" style="display:none;">
        <div class="panel-content">
            <div class="friends-full-container">
                <div class="friends-nav-bar">
                    <div id="btn-friends-close-main" class="friends-back-btn"></div>
                    <div class="friends-tabs-container">
                        <div class="friend-nav-tab active" data-target="tab-my-friends">
                            <div class="tab-icon" style="background-image: url('icons/icon-friends.png');"></div>
                            <span class="tab-label">Moi Przyjaciele</span>
                        </div>
                        <div class="friend-nav-tab" data-target="tab-world">
                            <div class="tab-icon" style="background-image: url('icons/wtymswiecie.png');"></div>
                            <span class="tab-label">W tym świecie</span>
                        </div>
                        <div class="friend-nav-tab" data-target="tab-games">
                            <div class="tab-icon" style="background-image: url('icons/grazinnymi.png');"></div>
                            <span class="tab-label">Gra z innymi</span>
                        </div>
                        <div class="friend-nav-tab" data-target="tab-search">
                            <div class="tab-icon" style="background-image: url('icons/szukaj.png');"></div>
                            <span class="tab-label">Szukaj</span>
                        </div>
                    </div>
                </div>

                <div class="friends-content-area">
                    <div id="tab-my-friends" class="tab-content active">
                        <div id="section-requests" style="display:none;">
                            <div class="friends-section-header">Prośby</div>
                            <div id="requests-grid" class="friends-grid"></div>
                        </div>
                        <div class="friends-section-header" style="opacity:0.5;">Wysłane</div>
                        <div class="friends-section-header">
                            <div class="status-dot online"></div>
                            Przyjaciele Online: <span id="online-count">0</span>
                        </div>
                        <div id="friends-online-grid" class="friends-grid"></div>
                        <div class="friends-section-header">
                            <div class="status-dot offline"></div>
                            Przyjaciele Offline: <span id="offline-count">0</span>
                        </div>
                        <div id="friends-offline-grid" class="friends-grid"></div>
                    </div>

                    <div id="tab-world" class="tab-content">
                        <p style="color:white; text-align:center; margin-top:50px;">Brak graczy w pobliżu.</p>
                    </div>
                    
                    <div id="tab-games" class="tab-content">
                        <p style="color:white; text-align:center; margin-top:50px;">Funkcja niedostępna.</p>
                    </div>

                    <div id="tab-search" class="tab-content">
                        <div class="search-bar-container">
                            <input id="friends-search-input-new" class="search-input" placeholder="gracz">
                            <div id="friends-search-btn-new" class="search-btn"></div>
                            <div id="friends-search-clear" class="clear-btn">Wyczyść</div>
                        </div>
                        <div id="search-results-grid-new" class="friends-grid" style="margin-top: 15px;"></div>
                    </div>

                </div>

            </div>
        </div>
    </div>
`;

export const MODALS_HTML = `
    <style>
        .nav-grid-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: auto;
            gap: 15px;
            justify-content: center;
            width: 100%;
            padding: 20px;
        }
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            transition: transform 0.1s;
            position: relative;
        }
        .nav-item:active { transform: scale(0.95); }
        .nav-btn-box {
            width: 110px; height: 110px;
            background-image: url('icons/NavigationButton.png');
            background-size: 100% 100%;
            background-repeat: no-repeat;
            background-position: center;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            position: relative;
            filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));
            padding-top: 15px;
        }
        .nav-icon {
            width: 55%; height: 55%;
            object-fit: contain;
            filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
            z-index: 1;
        }
        .nav-label {
            position: absolute;
            bottom: 12px;
            left: 0;
            width: 100%;
            color: white;
            font-size: 12px;
            font-family: 'Titan One', cursive;
            text-shadow: -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000;
            text-align: center;
            z-index: 2;
            pointer-events: none;
        }
        .nav-badge {
            position: absolute;
            top: -5px; right: -5px;
            background-color: #e74c3c;
            color: white;
            border: 2px solid white;
            border-radius: 50%;
            width: 28px; height: 28px;
            display: flex; justify-content: center; align-items: center;
            font-size: 14px; font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.5);
            z-index: 10;
        }
        #more-options-panel .panel-content {
            background: rgba(0,0,0,0.6) !important;
            border: none !important;
            box-shadow: none !important;
            width: 95vw !important;
            max-width: 800px !important;
        }
        #more-options-panel h2 { display: none; }
        #more-options-panel .panel-list { display: none; }
        #more-options-panel .panel-close-button { display: none; }
        
        @media (max-width: 600px) {
            .nav-grid-container {
                gap: 10px;
                grid-template-columns: repeat(3, 1fr);
            }
            .nav-btn-box {
                width: 90px; height: 90px;
            }
            .nav-label {
                font-size: 10px;
                bottom: 10px;
            }
        }
    </style>

    <div id="explore-exit-button"></div>
    
    <div id="victory-panel">
        <div class="victory-title text-outline">Parkour Ukończony!</div>
        <div class="victory-time text-outline" id="victory-time-display">00:00.00</div>
        <button id="victory-super-btn" class="victory-btn">Super!</button>
    </div>
    
    <div id="reward-panel">
        <h1 class="text-outline" id="reward-title-text">Otrzymujesz:</h1>
        <div class="reward-box-container">
            <div class="reward-box">
                <div class="reward-title text-outline">Nagroda</div>
                <div class="reward-row"><span id="reward-xp-val" class="text-outline">+500</span> <img src="icons/icon-level.png"></div>
                <div class="reward-row"><span id="reward-coins-val" class="text-outline">+100</span> <img src="icons/icon-coin.png"></div>
            </div>
        </div>
        <div class="level-progress-area">
            <div class="level-star-big"><span id="reward-lvl-cur" class="text-outline">1</span></div>
            <div class="reward-bar-bg"><div id="reward-bar-fill"></div><div id="reward-bar-text" class="text-outline">0/50</div></div>
            <div class="level-star-big"><span id="reward-lvl-next" class="text-outline">2</span></div>
        </div>
        <div class="reward-buttons">
            <button id="reward-btn-home"></button>
            <button id="reward-btn-replay"></button>
            <button id="reward-btn-next"></button>
        </div>
    </div>

    <div id="play-choice-panel" class="panel-modal">
        <div class="panel-content">
            <h2>W co chcesz zagrać?</h2>
            <div class="build-choice-grid">
                <div id="play-choice-parkour" class="play-choice-item">
                    <div class="play-choice-icon" style="background-image: url('icons/icon-parkour.png'); background-size: 70%; background-repeat: no-repeat; background-position: center; background-color: #e67e22;"></div>
                    <span class="play-choice-label text-outline">Parkour</span>
                </div>
                <div id="play-choice-chat" class="play-choice-item">
                    <div class="play-choice-icon" style="background-image: url('icons/icon-chat.png'); background-size: 70%; background-repeat: no-repeat; background-position: center; background-color: #3498db;"></div>
                    <span class="play-choice-label text-outline">Czat</span>
                </div>
            </div>
            <button class="panel-close-button">Anuluj</button>
        </div>
    </div>

    ${FRIENDS_MODAL_HTML}
    ${DISCOVER_CHOICE_HTML} 
    ${NEWS_MODAL_HTML}
    ${MAIL_MODAL_HTML}

    <div id="discover-panel" class="panel-modal"><div class="panel-content"><div class="friends-tabs" id="discover-tabs" style="display:none"><div class="friends-tab active" data-tab="all">Wszystkie</div><div class="friends-tab" data-tab="mine">Moje</div></div><h2 id="discover-panel-title">Wybierz</h2><div id="discover-list" class="panel-list"></div><button id="discover-close-button" class="panel-close-button">Zamknij</button></div></div>
    <div id="build-choice-panel" class="panel-modal"><div class="panel-content"><h2>Co budujemy?</h2><div class="build-choice-grid"><div id="build-choice-new-skin" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-newhypercube.png');"></div><span class="build-choice-label text-outline">Nowa HyperCube</span></div><div id="build-choice-new-world" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-newworld.png');"></div><span class="build-choice-label text-outline">Nowy Świat</span></div><div id="build-choice-new-prefab" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-newprefab.png');"></div><span class="build-choice-label text-outline">Nowy Prefabrykat</span></div><div id="build-choice-new-part" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-newhypercubepart.png');"></div><span class="build-choice-label text-outline">Nowa Część HyperCube</span></div></div><button class="panel-close-button">Anuluj</button></div></div>
    <div id="world-size-panel" class="panel-modal"><div class="panel-content"><h2>Rozmiar</h2><div class="build-choice-grid"><div id="size-choice-new-small" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-smallworld.png');"></div><span>Mały</span></div><div id="size-choice-new-medium" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-mediumworld.png');"></div><span>Średni</span></div><div id="size-choice-new-large" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-bigworld.png');"></div><span>Duży</span></div></div><button class="panel-close-button">Anuluj</button></div></div>
    <div id="shop-panel" class="panel-modal"><div class="panel-content"><h2>Sklep</h2><div class="friends-tabs" style="margin-bottom:15px;"><div class="friends-tab active" id="shop-tab-blocks">Bloki</div><div class="friends-tab" id="shop-tab-addons">Dodatki</div></div><div id="shop-list" class="panel-list"></div><button class="panel-close-button">Zamknij</button></div></div>
    <div id="add-choice-panel" class="panel-modal"><div class="panel-content"><h2>Dodaj</h2><div class="panel-list"><div id="add-choice-blocks" class="panel-item">Bloki</div><div id="add-choice-prefabs" class="panel-item">Prefabrykaty</div><div id="add-choice-parts" class="panel-item">Części</div></div><button id="add-choice-close" class="panel-close-button">Anuluj</button></div></div>
    <div id="player-preview-panel" class="panel-modal"><div class="panel-content"><h2>Podgląd</h2><div id="player-preview-renderer-container"></div><button class="panel-close-button">Zamknij</button></div></div>
    
    <!-- NOWA STRUKTURA PANELU OPCJI (BSP GRID) -->
    <div id="more-options-panel" class="panel-modal">
        <div class="nav-grid-container">
            <div class="nav-item"><div class="nav-btn-box"><img src="icons/misje.png" onerror="this.src='icons/icon-friends.png'" class="nav-icon"><span class="nav-label">Misje</span></div></div>
            <div class="nav-item" id="btn-open-news"><div class="nav-btn-box"><img src="icons/nagrody.png" onerror="this.src='icons/icon-shop.png'" class="nav-icon"><span class="nav-label">Nagrody</span><div id="rewards-badge" class="nav-badge" style="display:none;">0</div></div></div>
            <div class="nav-item" id="btn-open-highscores"><div class="nav-btn-box"><img src="icons/highscores.png" onerror="this.src='icons/icon-level.png'" class="nav-icon"><span class="nav-label">HighScores</span></div></div>
            <div class="nav-item"><div class="nav-btn-box"><img src="icons/tworzenie.png" onerror="this.src='icons/icon-build.png'" class="nav-icon"><span class="nav-label">Tworzenie</span></div></div>
            <div class="nav-item"><div class="nav-btn-box"><img src="icons/bezpieczenstwo.png" onerror="this.src='icons/icon-more.png'" class="nav-icon"><span class="nav-label">Bezpiecz.</span></div></div>
            <div class="nav-item" id="btn-nav-options"><div class="nav-btn-box"><img src="icons/opcje.png" onerror="this.src='icons/icon-more.png'" class="nav-icon"><span class="nav-label">Opcje</span></div></div>
            <div class="nav-item" id="logout-btn"><div class="nav-btn-box"><img src="icons/wyloguj.png" onerror="this.src='icons/icon-back.png'" class="nav-icon"><span class="nav-label">Wyloguj</span></div></div>
        </div>
    </div>
    
    <div id="name-input-panel" class="panel-modal"><div id="name-input-panel-container"><h2>Nick</h2><input id="name-input-field"><button id="name-submit-btn">OK</button></div></div>
`;
