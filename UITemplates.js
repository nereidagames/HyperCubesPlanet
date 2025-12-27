/* PLIK: UITemplates.js */

export const AUTH_HTML = `
<style>
    /* --- BSP LOGIN STYLE --- */
    #auth-screen {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: transparent;
        z-index: 99998;
        display: flex; flex-direction: column; justify-content: space-between;
        font-family: 'Titan One', cursive;
        pointer-events: none; /* Tło przepuszcza kliki do 3D */
    }

    /* Elementy interaktywne muszą reagować na kliknięcia */
    .bsp-interactive { pointer-events: auto !important; }

    /* GŁÓWNY EKRAN POWITALNY */
    #bsp-welcome-screen {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: space-between;
        padding: 10px;
        pointer-events: none;
    }

    /* Logo / Nagłówek */
    .bsp-top-header {
        text-align: center; margin-top: 10px;
        text-shadow: 2px 2px 0 #000; color: white; font-size: 24px;
        pointer-events: auto;
    }

    /* Prawy panel z przyciskami */
    .bsp-right-buttons {
        position: absolute; right: 20px; top: 50%; transform: translateY(-60%);
        display: flex; flex-direction: column; gap: 20px;
        align-items: flex-end;
        z-index: 100;
        pointer-events: none; 
    }

    /* --- PRZYCISKI - WERSJA PC (DUŻA) --- */
    .bsp-big-btn {
        width: 280px; height: 160px; /* Domyślny duży rozmiar */
        border: 4px solid white; border-radius: 20px;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        cursor: pointer; transition: transform 0.1s;
        box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        color: white; text-shadow: 2px 2px 0 #000;
        font-size: 32px; text-align: center; line-height: 1.1;
        pointer-events: auto; /* WAŻNE: To sprawia że przycisk działa */
    }
    .bsp-big-btn:active { transform: scale(0.95); }

    .btn-new-user {
        background: linear-gradient(to bottom, #8ede13 0%, #5ba806 100%);
    }
    .btn-login-big {
        background: linear-gradient(to bottom, #4facfe 0%, #0072ff 100%);
    }

    /* Dolne elementy */
    .bsp-bottom-bar {
        display: flex; justify-content: space-between; align-items: flex-end;
        width: 100%; padding-bottom: 10px;
        pointer-events: none;
    }

    .bsp-tip-box {
        background-color: #3498db;
        border: 2px solid white; border-radius: 10px;
        padding: 5px 10px; color: white; font-size: 11px;
        max-width: 250px; position: relative;
        box-shadow: 0 3px 5px rgba(0,0,0,0.3);
        pointer-events: auto;
    }
    .bsp-tip-box::after {
        content: ''; position: absolute; bottom: -10px; left: 20px;
        border-width: 10px 10px 0; border-style: solid;
        border-color: white transparent transparent transparent;
    }

    .btn-privacy {
        background: linear-gradient(to bottom, #f39c12, #d35400);
        border: 2px solid white; border-radius: 8px;
        padding: 8px 15px; color: white; font-size: 12px;
        cursor: pointer; box-shadow: 0 3px 0 #a04000;
        pointer-events: auto;
    }

    /* --- MODAL LOGOWANIA --- */
    #bsp-login-modal {
        position: absolute; right: 50px; top: 50%; transform: translateY(-50%);
        width: 320px;
        background: #3498db;
        border: 4px solid white; border-radius: 20px;
        padding: 20px; display: none;
        flex-direction: column; gap: 10px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.6);
        pointer-events: auto;
        z-index: 101;
    }
    
    .bsp-modal-title { font-size: 24px; color: white; text-align: center; text-shadow: 2px 2px 0 #000; margin-bottom: 5px; }
    
    .bsp-input {
        width: 100%; height: 45px;
        border-radius: 10px; border: none;
        padding: 0 15px; font-family: 'Titan One', cursive; font-size: 16px;
        box-shadow: inset 0 3px 5px rgba(0,0,0,0.2);
    }
    
    .bsp-checkbox-row {
        display: flex; align-items: center; gap: 10px; color: white; text-shadow: 1px 1px 0 #000; font-size: 14px;
    }
    .bsp-checkbox { width: 20px; height: 20px; cursor: pointer; }

    .bsp-btn-row { display: flex; gap: 10px; margin-top: 10px; }
    .bsp-btn-small {
        flex: 1; height: 45px;
        border: 3px solid white; border-radius: 10px;
        font-size: 18px; color: white; cursor: pointer;
        display: flex; justify-content: center; align-items: center;
        box-shadow: 0 4px 0 rgba(0,0,0,0.3);
    }
    .btn-red { background: #e74c3c; box-shadow: 0 4px 0 #c0392b; }
    .btn-green { background: #2ecc71; box-shadow: 0 4px 0 #27ae60; }
    .btn-red:active, .btn-green:active { transform: translateY(3px); box-shadow: none; }

    /* --- EKRAN REJESTRACJI --- */
    #bsp-register-screen {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: none;
        pointer-events: none;
    }

    .bsp-register-panel {
        position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
        width: 300px;
        background: #8ede13;
        border: 4px solid white; border-radius: 20px;
        padding: 15px; display: flex; flex-direction: column; gap: 8px;
        pointer-events: auto;
        z-index: 101;
    }

    .bsp-register-header { text-align: center; margin-bottom: 5px; }
    .bsp-register-header img { width: 120px; }

    .bsp-skin-selector {
        position: absolute; left: 40px; top: 50%; transform: translateY(-50%);
        display: flex; flex-direction: column; gap: 15px;
        pointer-events: auto;
    }

    .selector-row { display: flex; align-items: center; gap: 10px; }
    .selector-icon {
        width: 60px; height: 60px;
        background: #34495e; border: 3px solid white; border-radius: 10px;
        display: flex; justify-content: center; align-items: center;
    }
    .selector-icon img { width: 80%; }
    
    .selector-arrow {
        width: 45px; height: 45px;
        background: linear-gradient(to bottom, #fff, #eee);
        border: 3px solid #3498db; border-radius: 10px;
        display: flex; justify-content: center; align-items: center;
        font-size: 28px; color: #3498db; cursor: pointer;
        box-shadow: 0 4px 0 #2980b9;
    }
    .selector-arrow:active { transform: translateY(3px); box-shadow: none; }
    
    /* --- RESPONSYWNOŚĆ --- */
    
    /* Tablety i małe laptopy (pomiędzy 600 a 1024px) */
    @media (max-width: 1024px) {
        .bsp-big-btn { 
            width: 180px; 
            height: 90px; 
            font-size: 18px; 
            border-width: 3px;
        }
        .bsp-right-buttons { 
            gap: 15px; 
            transform: translateY(-60%);
        }
    }

    /* Telefony (poniżej 600px) */
    @media (max-width: 600px) {
        .bsp-big-btn { 
            width: 150px; 
            height: 80px; 
            font-size: 16px; 
            box-shadow: 0 5px 10px rgba(0,0,0,0.5);
        }
        .bsp-right-buttons { 
            right: 10px; 
            transform: translateY(-55%);
        }
        #bsp-login-modal, .bsp-register-panel { 
            width: 90%; 
            right: 5%; 
        }
        .bsp-skin-selector { 
            left: 10px; 
            transform: scale(0.8) translateY(-50%); 
        }
    }

</style>

<div id="auth-screen">
    
    <!-- 1. EKRAN POWITALNY (Start) -->
    <div id="bsp-welcome-screen">
        <div class="bsp-top-header bsp-interactive">
            Witaj na <span style="color:#f1c40f; text-shadow: 2px 2px 0 #000;">HyperCubesPlanet</span>
        </div>

        <div class="bsp-right-buttons">
            <div id="btn-show-register" class="bsp-big-btn btn-new-user">
                Nowy<br>Użytkownik
            </div>
            <div id="btn-show-login" class="bsp-big-btn btn-login-big">
                Zaloguj
            </div>
        </div>

        <div class="bsp-bottom-bar">
            <div class="bsp-tip-box text-outline">
                WSKAZÓWKA: Możesz się zalogować jako użytkownik: BlockStarPlanet, MovieStarPlanet.
            </div>
            <div class="btn-privacy text-outline">
                Polityka Prywatności
            </div>
        </div>
    </div>

    <!-- 2. MODAL LOGOWANIA -->
    <div id="bsp-login-modal">
        <div class="bsp-modal-title">Zaloguj tutaj</div>
        
        <form id="login-form" style="display:flex; flex-direction:column; gap:10px;">
            <input id="login-username" class="bsp-input" type="text" placeholder="Nazwa użytkownika" required>
            <input id="login-password" class="bsp-input" type="password" placeholder="Wprowadź hasło" required>
            
            <div class="bsp-checkbox-row">
                <input type="checkbox" class="bsp-checkbox" id="login-remember">
                <label for="login-remember">Zapisz moje hasło</label>
            </div>
            
            <div style="display:flex; justify-content:center; margin: 5px 0;">
                <div style="width:35px; height:22px; background:linear-gradient(to bottom, #fff 50%, #e74c3c 50%); border:1px solid #ddd;"></div>
                <span style="margin-left:5px; font-size:12px; color:white;">Polska</span>
            </div>

            <div class="bsp-btn-row">
                <div id="btn-login-cancel" class="bsp-btn-small btn-red">Anuluj</div>
                <button type="submit" class="bsp-btn-small btn-green">Ok</button>
            </div>
            
            <div style="text-align:center; font-size:12px; color:white; margin-top:5px; cursor:pointer; text-decoration:underline;">
                Nie pamiętasz hasła?
            </div>
        </form>
        <div id="auth-message" style="color:yellow; text-align:center; text-shadow:1px 1px 0 #000; font-size:12px; margin-top:5px;"></div>
    </div>

    <!-- 3. EKRAN REJESTRACJI -->
    <div id="bsp-register-screen">
        
        <!-- Lewy panel wyboru -->
        <div class="bsp-skin-selector">
            <div class="selector-row">
                <div id="skin-prev" class="selector-arrow bsp-interactive">⬅</div>
                <div class="selector-icon">
                    <img src="icons/icon-newhypercube.png" onerror="this.src='icons/icon-build.png'">
                </div>
                <div id="skin-next" class="selector-arrow bsp-interactive">➡</div>
            </div>
            <div class="selector-row" style="opacity:0.5; filter:grayscale(1);">
                <div class="selector-arrow">⬅</div>
                <div class="selector-icon">
                    <img src="icons/icon-jump.png">
                </div>
                <div class="selector-arrow">➡</div>
            </div>
        </div>

        <!-- Prawy panel formularza -->
        <div class="bsp-register-panel">
            <div class="bsp-register-header">
                <div class="text-outline" style="font-size:22px; color:white;">Nowy</div>
                <img src="icons/favicon.png" style="height:35px; object-fit:contain;">
            </div>

            <form id="register-form" style="display:flex; flex-direction:column; gap:8px;">
                <input id="register-username" class="bsp-input" type="text" placeholder="Wprowadź nick" required minlength="3" maxlength="15">
                <input id="register-password" class="bsp-input" type="password" placeholder="Wprowadź hasło" required minlength="6">
                <input id="register-password-confirm" class="bsp-input" type="password" placeholder="Powtórz hasło" required>
                
                <div class="bsp-checkbox-row">
                    <input type="checkbox" class="bsp-checkbox" id="reg-hide-pass">
                    <label for="reg-hide-pass">Ukryć hasło?</label>
                </div>

                <div style="display:flex; justify-content:center;">
                    <div style="width:35px; height:22px; background:linear-gradient(to bottom, #fff 50%, #e74c3c 50%); border:1px solid #ddd;"></div>
                    <span style="margin-left:5px; font-size:12px; color:white;">Polska</span>
                </div>

                <div class="bsp-btn-row">
                    <div id="btn-register-cancel" class="bsp-btn-small btn-red">Anuluj</div>
                    <button type="submit" class="bsp-btn-small btn-green">Ok</button>
                </div>
            </form>
            
            <div style="background:#3498db; color:white; font-size:10px; text-align:center; padding:4px; border-radius:5px; margin-top:2px; border:2px solid white;">
                Warunki Korzystania
            </div>
             <div class="btn-privacy text-outline" style="font-size:10px; padding:4px; text-align:center;">
                Polityka Prywatności
            </div>
        </div>
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
            <div id="skin-btn-share" class="skin-action-btn">
                <div class="skin-btn-icon" style="background-image: url('icons/icon-share.png');"></div>
                <div class="skin-btn-label text-outline">Udostępnij</div>
            </div>
            
            <div id="skin-btn-like" class="skin-action-btn">
                <div class="skin-btn-icon" style="background-image: url('icons/icon-like.png');"></div>
                <div class="skin-btn-label text-outline">Polub</div>
            </div>
            
            <div id="skin-btn-comment" class="skin-action-btn">
                <div class="skin-btn-icon" style="background-image: url('icons/icon-chat.png');"></div>
                <div class="skin-btn-label text-outline">0</div>
            </div>
            
            <div id="skin-btn-use" class="skin-action-btn" style="display:none;">
                <div class="skin-btn-icon" style="background-image: url('icons/icon-play.png');"></div>
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
                
                <!-- NAVIGATION -->
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

                <!-- CONTENT AREA -->
                <div class="friends-content-area">
                    
                    <!-- TAB 1: MOI PRZYJACIELE -->
                    <div id="tab-my-friends" class="tab-content active">
                        
                        <!-- SEKCJA: PROŚBY -->
                        <div id="section-requests" style="display:none;">
                            <div class="friends-section-header">Prośby</div>
                            <div id="requests-grid" class="friends-grid"></div>
                        </div>

                        <!-- SEKCJA: WYSŁANE (Placeholder) -->
                        <div class="friends-section-header" style="opacity:0.5;">Wysłane</div>
                        
                        <!-- SEKCJA: ONLINE -->
                        <div class="friends-section-header">
                            <div class="status-dot online"></div>
                            Przyjaciele Online: <span id="online-count">0</span>
                        </div>
                        <div id="friends-online-grid" class="friends-grid"></div>

                        <!-- SEKCJA: OFFLINE -->
                        <div class="friends-section-header">
                            <div class="status-dot offline"></div>
                            Przyjaciele Offline: <span id="offline-count">0</span>
                        </div>
                        <div id="friends-offline-grid" class="friends-grid"></div>
                    </div>

                    <!-- TAB 2: W TYM ŚWIECIE (Placeholder) -->
                    <div id="tab-world" class="tab-content">
                        <p style="color:white; text-align:center; margin-top:50px;">Brak graczy w pobliżu.</p>
                    </div>
                    
                    <!-- TAB 3: GRA Z INNYMI (Placeholder) -->
                    <div id="tab-games" class="tab-content">
                        <p style="color:white; text-align:center; margin-top:50px;">Funkcja niedostępna.</p>
                    </div>

                    <!-- TAB 4: SZUKAJ -->
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

export const PLAYER_PROFILE_HTML = `
    <style>
        #player-profile-panel .panel-content {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: auto !important;
            height: auto !important;
            max-width: none !important;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
        }

        /* Główny kontener profilu */
        .profile-container {
            width: 450px;
            height: 400px;
            background: radial-gradient(circle, #5addc5 0%, #16a085 100%); /* Turkusowy gradient */
            border-radius: 20px;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-family: 'Titan One', cursive;
        }

        /* Górny pasek z nickiem */
        .profile-header {
            position: absolute;
            top: 15px; left: 0; right: 0;
            height: 50px;
            background-color: #0d8a72; /* Ciemniejszy turkus */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            text-shadow: 1.5px 1.5px 0 #000;
            z-index: 2;
        }

        .profile-name { font-size: 20px; text-transform: uppercase; }
        .profile-joined { font-size: 10px; opacity: 0.9; }

        /* Gwiazda z levelem (nachodząca na pasek) */
        .level-star-large {
            position: absolute;
            top: -10px; left: -10px;
            width: 90px; height: 90px;
            background: url('icons/icon-level.png') center/contain no-repeat;
            display: flex; justify-content: center; align-items: center;
            font-size: 32px; color: white;
            text-shadow: 2px 2px 0 #000;
            z-index: 10;
            filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));
        }

        /* Flaga pod gwiazdą */
        .profile-flag {
            position: absolute;
            top: 85px; left: 20px;
            width: 40px; height: 25px;
            background-color: #fff;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex; justify-content: center; align-items: center;
            font-size: 20px;
        }

        /* Canvas 3D (Postać) */
        #profile-preview-canvas {
            position: absolute;
            top: 65px; left: 50px; right: 80px; bottom: 50px;
            z-index: 1;
        }
        
        /* Cień/Poświata za postacią */
        .profile-glow {
            position: absolute;
            top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
            z-index: 0;
            pointer-events: none;
        }

        /* Pasek boczny (Przyciski) */
        .profile-sidebar {
            position: absolute;
            top: 15px; right: -70px; /* PRZESUNIĘTO NA PRAWO */
            display: flex; flex-direction: column; gap: 10px;
            z-index: 5;
        }

        .sidebar-btn {
            width: 80px; height: 80px;
            background: linear-gradient(to bottom, #54a0ff, #2e86de);
            border: 3px solid white;
            border-radius: 15px;
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
            box-shadow: 0 5px 0 #1e60a3, 5px 5px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.1s;
        }
        .sidebar-btn:active { transform: translateY(4px); box-shadow: 5px 1px 10px rgba(0,0,0,0.3); }

        .sidebar-icon { width: 40px; height: 40px; background-size: contain; background-repeat: no-repeat; background-position: center; margin-bottom: 2px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3)); }
        .sidebar-label { color: white; font-size: 12px; text-shadow: 1px 1px 0 #000; }

        /* Strzałki nawigacji na dole */
        .nav-arrow {
            position: absolute; bottom: 20px;
            width: 60px; height: 60px;
            background-color: transparent;
            border: none;
            box-shadow: none;
            cursor: pointer;
            background-repeat: no-repeat;
            background-position: center;
            background-size: contain;
            filter: drop-shadow(2px 4px 2px rgba(0,0,0,0.4));
            transition: transform 0.1s;
        }
        .nav-arrow:active { transform: scale(0.9); }
        .nav-arrow.left { left: 20px; background-image: url('icons/arrow-left.png'); }
        .nav-arrow.right { right: 100px; background-image: url('icons/arrow-right.png'); } 
        

        /* Responsywność dla mobile */
        @media (max-width: 600px) {
            .profile-container { width: 90vw; height: 80vw; max-height: 400px; }
            .sidebar-btn { width: 60px; height: 60px; }
            .profile-sidebar { right: -55px; } /* Mobile adjustment */
            .sidebar-icon { width: 30px; height: 30px; }
            .sidebar-label { font-size: 10px; }
            .level-star-large { width: 70px; height: 70px; font-size: 24px; }
            .nav-arrow { width: 40px; height: 40px; font-size: 24px; }
        }
    </style>

    <div id="player-profile-panel" class="panel-modal" style="display:none;">
        <div class="panel-content">
            <div class="profile-container">
                <!-- Gwiazda -->
                <div class="level-star-large">
                    <span id="profile-level-val" style="margin-top:5px;">1</span>
                </div>

                <!-- Nagłówek -->
                <div class="profile-header">
                    <div id="profile-username" class="profile-name">PLAYER</div>
                    <div id="profile-joined-date" class="profile-joined">Członek od maj, 2024</div>
                </div>

                <!-- Flaga -->
                <div class="profile-flag">🇵🇱</div>

                <!-- Postać 3D -->
                <div class="profile-glow"></div>
                <div id="profile-preview-canvas"></div>

                <!-- Przyciski boczne (tylko Ściana) -->
                <div class="profile-sidebar">
                    <div id="btn-profile-wall" class="sidebar-btn">
                        <!-- ZMIANA: Ikona sciana.png -->
                        <div class="sidebar-icon" style="background-image: url('icons/sciana.png');"></div>
                        <span class="sidebar-label">Ściana</span>
                    </div>
                </div>

                <!-- Strzałki nawigacji -->
                <div class="nav-arrow left"></div>
                <div class="nav-arrow right"></div>
            </div>
        </div>
    </div>
`;

export const OTHER_PLAYER_PROFILE_HTML = `
<style>
    /* Kontener modala */
    #other-player-profile-panel .panel-content {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        width: auto !important;
        height: auto !important;
        pointer-events: auto;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .bsp-profile-wrapper {
        display: flex;
        gap: 10px;
        font-family: 'Titan One', cursive;
        position: relative;
    }

    /* Główna karta (niebieska) */
    .bsp-main-card {
        width: 380px;
        height: 450px;
        background: radial-gradient(circle at center, #7ed6df 0%, #22a6b3 100%);
        border-radius: 20px;
        border: 4px solid rgba(0,0,0,0.2);
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    /* Nagłówek */
    .bsp-header {
        width: 100%;
        height: 60px;
        background: linear-gradient(to bottom, #4facfe, #00f2fe);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        text-shadow: 1.5px 1.5px 0 #000;
        box-shadow: 0 4px 5px rgba(0,0,0,0.2);
        z-index: 2;
        border-bottom: 2px solid rgba(255,255,255,0.3);
    }
    .bsp-username { font-size: 22px; margin-bottom: 2px; }
    .bsp-joined { font-size: 11px; opacity: 0.9; }

    /* Gwiazda Levelu */
    .bsp-level-star {
        position: absolute;
        top: -10px; left: -10px;
        width: 90px; height: 90px;
        background: url('icons/icon-level.png') center/contain no-repeat;
        display: flex; justify-content: center; align-items: center;
        font-size: 32px; color: white;
        text-shadow: 2px 2px 0 #000;
        z-index: 10;
        filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.4));
        transform: rotate(-10deg);
    }

    /* Kropka statusu */
    .bsp-status-dot {
        position: absolute;
        top: 15px; right: 15px;
        width: 25px; height: 25px;
        background: radial-gradient(circle at 30% 30%, #2ecc71, #27ae60);
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        z-index: 10;
        display: none; /* Domyślnie ukryta */
    }
    .bsp-status-dot.offline { background: radial-gradient(circle at 30% 30%, #e74c3c, #c0392b); }

    /* Flaga */
    .bsp-flag {
        position: absolute;
        top: 75px; left: 20px;
        width: 45px; height: 30px;
        background-color: #fff; /* Placeholder dla Polski */
        background-image: linear-gradient(to bottom, #fff 50%, #dc143c 50%);
        border: 2px solid white;
        border-radius: 6px;
        box-shadow: 0 3px 5px rgba(0,0,0,0.2);
        z-index: 5;
    }

    /* Canvas 3D */
    #other-player-preview-canvas {
        position: absolute;
        top: 60px; left: 0; width: 100%; height: 100%;
        z-index: 1;
    }

    /* Dolne przyciski (Report, Friend) */
    .bsp-corner-btn {
        position: absolute;
        bottom: 15px;
        width: 60px; height: 60px;
        border-radius: 12px;
        border: 3px solid white;
        cursor: pointer;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        box-shadow: 0 5px 0 rgba(0,0,0,0.3);
        transition: transform 0.1s;
        z-index: 10;
    }
    .bsp-corner-btn:active { transform: translateY(4px); box-shadow: none; }

    .btn-report {
        left: 15px;
        background: #535c68; /* Szary */
        background-image: url('icons/alert.png'); /* Placeholder */
        background-size: 60%; background-repeat: no-repeat; background-position: center;
    }
    /* Fallback icon for report */
    .btn-report::after { content: '⚠️'; font-size: 30px; }

    .btn-friend-action {
        right: 15px;
        background: linear-gradient(to bottom, #e74c3c, #c0392b); /* Czerwony - usuń/anuluj */
    }
    .friend-icon-placeholder { font-size: 30px; filter: drop-shadow(1px 1px 0 #000); }

    /* Pasek boczny (Sidebar) */
    .bsp-sidebar {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 10px;
    }

    .bsp-side-btn {
        width: 100px; height: 75px;
        background: linear-gradient(to bottom, #4facfe, #00f2fe);
        border: 3px solid white;
        border-radius: 15px;
        display: flex; flex-direction: column;
        justify-content: center; align-items: center;
        box-shadow: 0 5px 0 #2980b9, 0 8px 10px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.1s;
        position: relative;
    }
    .bsp-side-btn:active { transform: translateY(4px); box-shadow: 0 1px 0 #2980b9; }
    
    .bsp-side-btn.green {
        background: linear-gradient(to bottom, #2ecc71, #27ae60);
        box-shadow: 0 5px 0 #1e8449, 0 8px 10px rgba(0,0,0,0.3);
    }
    .bsp-side-btn.green:active { transform: translateY(4px); box-shadow: 0 1px 0 #1e8449; }

    .bsp-btn-icon {
        width: 35px; height: 35px;
        background-size: contain; background-repeat: no-repeat; background-position: center;
        filter: drop-shadow(0 2px 0 rgba(0,0,0,0.2));
        margin-bottom: 2px;
    }
    .bsp-btn-label {
        font-size: 13px; color: white; text-shadow: 1.5px 1.5px 0 #000;
        font-weight: bold;
    }

    /* Zamknięcie */
    .bsp-close-x {
        position: absolute;
        top: -15px; right: -15px;
        width: 40px; height: 40px;
        background: #e74c3c;
        border: 3px solid white;
        border-radius: 50%;
        color: white; font-size: 20px; font-weight: bold;
        display: flex; justify-content: center; align-items: center;
        cursor: pointer; z-index: 20;
        box-shadow: 0 3px 5px rgba(0,0,0,0.3);
    }

    /* Responsive mobile */
    @media (max-width: 600px) {
        .bsp-profile-wrapper { flex-direction: column; align-items: center; gap: 5px; transform: scale(0.9); }
        .bsp-sidebar { flex-direction: row; flex-wrap: wrap; justify-content: center; width: 380px; }
        .bsp-side-btn { width: 70px; height: 60px; }
        .bsp-btn-label { font-size: 10px; }
        .bsp-btn-icon { width: 25px; height: 25px; }
    }
</style>

<div id="other-player-profile-panel" class="panel-modal" style="display:none;">
    <div class="panel-content">
        <div class="bsp-profile-wrapper">
            
            <!-- Główna karta -->
            <div class="bsp-main-card">
                <div class="bsp-close-x" id="btn-other-profile-close">X</div>

                <!-- Level -->
                <div class="bsp-level-star">
                    <span id="other-profile-level" style="transform: rotate(10deg); margin-top:5px;">100</span>
                </div>

                <!-- Status -->
                <div id="other-profile-status" class="bsp-status-dot"></div>

                <!-- Header -->
                <div class="bsp-header">
                    <div id="other-profile-username" class="bsp-username">cybervamp</div>
                    <div id="other-profile-date" class="bsp-joined">Członek od maj, 2024</div>
                </div>

                <!-- Flaga -->
                <div class="bsp-flag"></div>

                <!-- Postać -->
                <div id="other-player-preview-canvas"></div>

                <!-- Dolne przyciski -->
                <div class="bsp-corner-btn btn-report"></div>
                <div id="btn-other-friend-action" class="bsp-corner-btn btn-friend-action">
                    <div class="friend-icon-placeholder">👤🗑️</div>
                </div>
            </div>

            <!-- Boczny pasek -->
            <div class="bsp-sidebar">
                <!-- 1. Ściana -->
                <div id="btn-other-wall" class="bsp-side-btn">
                    <div class="bsp-btn-icon" style="background-image: url('icons/icon-like.png');"></div>
                    <div class="bsp-btn-label">Ściana</div>
                </div>
                
                <!-- 2. Czat -->
                <div id="btn-other-chat" class="bsp-side-btn">
                    <div class="bsp-btn-icon" style="background-image: url('icons/icon-chat.png');"></div>
                    <div class="bsp-btn-label">Czat</div>
                </div>

                <!-- 3. Uśmiech (Z NAPRAWIONYM ID) -->
                <div id="btn-other-smile" class="bsp-side-btn">
                    <div class="bsp-btn-icon" style="background-image: url('icons/usmiech.png');">🎉</div> 
                    <div class="bsp-btn-label">Uśmiech</div>
                </div>

                <!-- 4. Zaproś -->
                <div class="bsp-side-btn green">
                    <div class="bsp-btn-icon" style="background-image: url('icons/gamepad.png');">🎮</div>
                    <div class="bsp-btn-label">Zaproś</div>
                </div>

                <!-- 5. Dom (Placeholder) -->
                <div class="bsp-side-btn">
                    <div class="bsp-btn-icon" style="background-image: url('icons/icon-home.png');"></div>
                    <div class="bsp-btn-label">Dom</div>
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