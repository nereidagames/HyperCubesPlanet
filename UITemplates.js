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
        pointer-events: none;
    }

    .bsp-interactive { pointer-events: auto !important; }

    #bsp-welcome-screen {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; flex-direction: column; justify-content: space-between;
        padding: 10px;
        pointer-events: none;
    }

    .bsp-top-header {
        text-align: center; margin-top: 10px;
        text-shadow: 2px 2px 0 #000; color: white; font-size: 24px;
        pointer-events: auto;
    }

    .bsp-right-buttons {
        position: absolute; right: 20px; top: 50%; transform: translateY(-60%);
        display: flex; flex-direction: column; gap: 20px;
        align-items: flex-end;
        z-index: 100;
        pointer-events: none; 
    }

    .bsp-big-btn {
        width: 280px; height: 160px;
        border: 4px solid white; border-radius: 20px;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        cursor: pointer; transition: transform 0.1s;
        box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        color: white; text-shadow: 2px 2px 0 #000;
        font-size: 32px; text-align: center; line-height: 1.1;
        pointer-events: auto;
    }
    .bsp-big-btn:active { transform: scale(0.95); }

    .btn-new-user { background: linear-gradient(to bottom, #8ede13 0%, #5ba806 100%); }
    .btn-login-big { background: linear-gradient(to bottom, #4facfe 0%, #0072ff 100%); }

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
    
    .bsp-checkbox-row { display: flex; align-items: center; gap: 10px; color: white; text-shadow: 1px 1px 0 #000; font-size: 14px; }
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
    
    @media (max-width: 1024px) {
        .bsp-big-btn { width: 180px; height: 90px; font-size: 18px; border-width: 3px; }
        .bsp-right-buttons { gap: 15px; transform: translateY(-60%); }
    }

    @media (max-width: 600px) {
        .bsp-big-btn { width: 150px; height: 80px; font-size: 16px; box-shadow: 0 5px 10px rgba(0,0,0,0.5); }
        .bsp-right-buttons { right: 10px; transform: translateY(-55%); }
        #bsp-login-modal, .bsp-register-panel { width: 90%; right: 5%; }
        .bsp-skin-selector { left: 10px; transform: scale(0.8) translateY(-50%); }
    }
</style>

<div id="auth-screen">
    <div id="bsp-welcome-screen">
        <div class="bsp-top-header bsp-interactive">Witaj na <span style="color:#f1c40f; text-shadow: 2px 2px 0 #000;">HyperCubesPlanet</span></div>
        <div class="bsp-right-buttons">
            <div id="btn-show-register" class="bsp-big-btn btn-new-user">Nowy<br>Użytkownik</div>
            <div id="btn-show-login" class="bsp-big-btn btn-login-big">Zaloguj</div>
        </div>
        <div class="bsp-bottom-bar">
            <div class="bsp-tip-box text-outline">WSKAZÓWKA: Możesz się zalogować jako użytkownik: BlockStarPlanet, MovieStarPlanet.</div>
            <div class="btn-privacy text-outline">Polityka Prywatności</div>
        </div>
    </div>
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
            <div style="text-align:center; font-size:12px; color:white; margin-top:5px; cursor:pointer; text-decoration:underline;">Nie pamiętasz hasła?</div>
        </form>
        <div id="auth-message" style="color:yellow; text-align:center; text-shadow:1px 1px 0 #000; font-size:12px; margin-top:5px;"></div>
    </div>
    <div id="bsp-register-screen">
        <div class="bsp-skin-selector">
            <div class="selector-row">
                <div id="skin-prev" class="selector-arrow bsp-interactive">⬅</div>
                <div class="selector-icon"><img src="icons/icon-newhypercube.png" onerror="this.src='icons/icon-build.png'"></div>
                <div id="skin-next" class="selector-arrow bsp-interactive">➡</div>
            </div>
            <div class="selector-row" style="opacity:0.5; filter:grayscale(1);">
                <div class="selector-arrow">⬅</div>
                <div class="selector-icon"><img src="icons/icon-jump.png"></div>
                <div class="selector-arrow">➡</div>
            </div>
        </div>
        <div class="bsp-register-panel">
            <div class="bsp-register-header"><div class="text-outline" style="font-size:22px; color:white;">Nowy</div><img src="icons/favicon.png" style="height:35px; object-fit:contain;"></div>
            <form id="register-form" style="display:flex; flex-direction:column; gap:8px;">
                <input id="register-username" class="bsp-input" type="text" placeholder="Wprowadź nick" required minlength="3" maxlength="15">
                <input id="register-password" class="bsp-input" type="password" placeholder="Wprowadź hasło" required minlength="6">
                <input id="register-password-confirm" class="bsp-input" type="password" placeholder="Powtórz hasło" required>
                <div class="bsp-checkbox-row"><input type="checkbox" class="bsp-checkbox" id="reg-hide-pass"><label for="reg-hide-pass">Ukryć hasło?</label></div>
                <div style="display:flex; justify-content:center;"><div style="width:35px; height:22px; background:linear-gradient(to bottom, #fff 50%, #e74c3c 50%); border:1px solid #ddd;"></div><span style="margin-left:5px; font-size:12px; color:white;">Polska</span></div>
                <div class="bsp-btn-row"><div id="btn-register-cancel" class="bsp-btn-small btn-red">Anuluj</div><button type="submit" class="bsp-btn-small btn-green">Ok</button></div>
            </form>
            <div style="background:#3498db; color:white; font-size:10px; text-align:center; padding:4px; border-radius:5px; margin-top:2px; border:2px solid white;">Warunki Korzystania</div>
             <div class="btn-privacy text-outline" style="font-size:10px; padding:4px; text-align:center;">Polityka Prywatności</div>
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
    <style>
        .build-ui-button { position: absolute; pointer-events: auto; cursor: url('icons/cursor.png'), auto; background-color: #2c75ff; border: 3px solid white; border-radius: 10px; display: flex; justify-content: center; align-items: center; font-size: 24px; box-shadow: 0 4px 8px #0004; transition: transform 0.1s ease, background-color 0.2s ease, filter 0.2s ease; color: white; text-shadow: 1.5px 1.5px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000; font-family: 'Titan One', cursive; }
        .build-ui-button:hover { background-color: #4c8cff; } 
        .build-ui-button:active { transform: scale(0.95); }
        
        #build-exit-button { top: 20px; left: 20px; width: 60px; height: 60px; background: url('icons/icon-back.png') center center / contain no-repeat; border: none; box-shadow: none; }
        #build-mode-button { top: 20px; right: 20px; width: 180px; height: 50px; font-size: 20px; }
        #build-save-button { top: 100px; left: 20px; width: 150px; height: 60px; background-color: #2ed573; font-size: 24px; }
        #build-add-button { bottom: 20px; left: 20px; width: 60px; height: 60px; font-size: 36px; z-index: 2005; }
        
        #build-tools-right { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 15px; pointer-events: auto; }
        .tool-btn { width: 60px; height: 60px; background-color: rgba(0, 0, 0, 0.6); border: 3px solid white; border-radius: 10px; cursor: url('icons/cursor.png'), auto; display: flex; justify-content: center; align-items: center; font-size: 30px; color: white; transition: transform 0.1s, background-color 0.1s; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
        .tool-btn.active { background-color: #2ed573; transform: scale(1.1); border-color: #ffd700; } 
        
        #build-rotate-zone { position: absolute; bottom: 30px; right: 30px; width: 120px; height: 120px; background: rgba(0, 0, 0, 0.4); border: 4px solid white; border-radius: 50%; pointer-events: auto; cursor: grab; z-index: 2001; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); }
        .rotate-icon { font-size: 50px; color: white; filter: drop-shadow(2px 2px 0 #000); }

        #block-selection-panel, #prefab-selection-panel, #part-selection-panel { 
            position: absolute; 
            bottom: 90px; 
            left: 20px;
            background: rgba(0, 0, 0, 0.85); 
            border: 3px solid white; 
            border-radius: 15px; 
            padding: 15px; 
            display: none; 
            flex-direction: column; 
            gap: 15px; 
            width: 340px; 
            pointer-events: auto; 
            max-height: 50vh; 
            overflow-y: auto; 
            z-index: 3000;
            box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        }

        #build-block-list { 
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
            gap: 10px;
            width: 100%;
            justify-items: center;
        }

        .block-item, .prefab-item, .part-item { 
            width: 50px; height: 50px; 
            border: 2px solid #ddd; border-radius: 8px; 
            cursor: url('icons/cursor.png'), auto; 
            transition: transform 0.1s ease; 
            color: white; 
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            background-color: rgba(255,255,255,0.1);
            flex-shrink: 0; 
        } 
        .block-item:hover, .prefab-item:hover, .part-item:hover { transform: scale(1.1); border-color: #00ff00; }
        
        .part-item, .prefab-item { width: 100%; height: auto; padding: 10px; text-align: left; font-size: 14px; }

        @media (max-width: 900px) {
            #block-selection-panel, #prefab-selection-panel, #part-selection-panel {
                left: 50%; transform: translateX(-50%); bottom: 100px; width: 70vw; max-width: 400px;
            }
            .block-item { width: 60px; height: 60px; }
            #build-block-list { grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 15px; }
        }
    </style>

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

        .profile-container {
            width: 450px; height: 400px;
            background: radial-gradient(circle, #5addc5 0%, #16a085 100%);
            border-radius: 20px; position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-family: 'Titan One', cursive;
        }

        .profile-header {
            position: absolute; top: 15px; left: 0; right: 0; height: 50px;
            background-color: #0d8a72;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            color: white; text-shadow: 1.5px 1.5px 0 #000; z-index: 2;
        }

        .profile-name { font-size: 20px; text-transform: uppercase; }
        .profile-joined { font-size: 10px; opacity: 0.9; }

        .level-star-large {
            position: absolute; top: -10px; left: -10px; width: 90px; height: 90px;
            background: url('icons/icon-level.png') center/contain no-repeat;
            display: flex; justify-content: center; align-items: center;
            font-size: 32px; color: white; text-shadow: 2px 2px 0 #000; z-index: 10;
            filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));
        }

        .profile-flag {
            position: absolute; top: 85px; left: 20px; width: 40px; height: 25px;
            background-color: #fff; border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex; justify-content: center; align-items: center; font-size: 20px;
        }

        #profile-preview-canvas {
            position: absolute; top: 65px; left: 50px; right: 80px; bottom: 50px; z-index: 1;
        }
        
        .profile-glow {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 200px; height: 200px;
            background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
            z-index: 0; pointer-events: none;
        }

        .profile-sidebar {
            position: absolute; top: 15px; right: -70px;
            display: flex; flex-direction: column; gap: 10px; z-index: 5;
        }

        .sidebar-btn {
            width: 80px; height: 80px;
            background: linear-gradient(to bottom, #54a0ff, #2e86de);
            border: 3px solid white; border-radius: 15px;
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            box-shadow: 0 5px 0 #1e60a3, 5px 5px 10px rgba(0,0,0,0.3);
            cursor: pointer; transition: transform 0.1s;
        }
        .sidebar-btn:active { transform: translateY(4px); box-shadow: 5px 1px 10px rgba(0,0,0,0.3); }

        .sidebar-icon { width: 40px; height: 40px; background-size: contain; background-repeat: no-repeat; background-position: center; margin-bottom: 2px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3)); }
        .sidebar-label { color: white; font-size: 12px; text-shadow: 1px 1px 0 #000; }

        .nav-arrow {
            position: absolute; bottom: 20px; width: 60px; height: 60px;
            background-color: transparent; border: none; box-shadow: none;
            cursor: pointer; background-repeat: no-repeat; background-position: center; background-size: contain;
            filter: drop-shadow(2px 4px 2px rgba(0,0,0,0.4)); transition: transform 0.1s;
        }
        .nav-arrow:active { transform: scale(0.9); }
        .nav-arrow.left { left: 20px; background-image: url('icons/arrow-left.png'); }
        .nav-arrow.right { right: 100px; background-image: url('icons/arrow-right.png'); } 
        
        @media (max-width: 600px) {
            .profile-container { width: 90vw; height: 80vw; max-height: 400px; }
            .sidebar-btn { width: 60px; height: 60px; }
            .profile-sidebar { right: -55px; } 
            .sidebar-icon { width: 30px; height: 30px; }
            .sidebar-label { font-size: 10px; }
            .level-star-large { width: 70px; height: 70px; font-size: 24px; }
            .nav-arrow { width: 40px; height: 40px; font-size: 24px; }
        }
    </style>

    <div id="player-profile-panel" class="panel-modal" style="display:none;">
        <div class="panel-content">
            <div class="profile-container">
                <div class="level-star-large"><span id="profile-level-val" style="margin-top:5px;">1</span></div>
                <div class="profile-header">
                    <div id="profile-username" class="profile-name">PLAYER</div>
                    <div id="profile-joined-date" class="profile-joined">Członek od maj, 2024</div>
                </div>
                <div class="profile-flag">🇵🇱</div>
                <div class="profile-glow"></div>
                <div id="profile-preview-canvas"></div>
                <div class="profile-sidebar">
                    <div id="btn-profile-wall" class="sidebar-btn">
                        <div class="sidebar-icon" style="background-image: url('icons/sciana.png');"></div>
                        <span class="sidebar-label">Ściana</span>
                    </div>
                </div>
                <div class="nav-arrow left"></div>
                <div class="nav-arrow right"></div>
            </div>
        </div>
    </div>
`;

export const OTHER_PLAYER_PROFILE_HTML = `
<style>
    #other-player-profile-panel .panel-content {
        background: transparent !important; box-shadow: none !important; border: none !important;
        padding: 0 !important; width: auto !important; height: auto !important; pointer-events: auto;
        display: flex; justify-content: center; align-items: center;
    }

    .bsp-profile-wrapper { display: flex; gap: 10px; font-family: 'Titan One', cursive; position: relative; }

    .bsp-main-card {
        width: 380px; height: 450px;
        background: radial-gradient(circle at center, #7ed6df 0%, #22a6b3 100%);
        border-radius: 20px; border: 4px solid rgba(0,0,0,0.2);
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center;
    }

    .bsp-header {
        width: 100%; height: 60px; background: linear-gradient(to bottom, #4facfe, #00f2fe);
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        color: white; text-shadow: 1.5px 1.5px 0 #000; box-shadow: 0 4px 5px rgba(0,0,0,0.2); z-index: 2;
        border-bottom: 2px solid rgba(255,255,255,0.3);
    }
    .bsp-username { font-size: 22px; margin-bottom: 2px; }
    .bsp-joined { font-size: 11px; opacity: 0.9; }

    .bsp-level-star {
        position: absolute; top: -10px; left: -10px; width: 90px; height: 90px;
        background: url('icons/icon-level.png') center/contain no-repeat;
        display: flex; justify-content: center; align-items: center;
        font-size: 32px; color: white; text-shadow: 2px 2px 0 #000; z-index: 10;
        filter: drop-shadow(2px 4px 4px rgba(0,0,0,0.4)); transform: rotate(-10deg);
    }

    .bsp-status-dot {
        position: absolute; top: 15px; right: 15px; width: 25px; height: 25px;
        background: radial-gradient(circle at 30% 30%, #2ecc71, #27ae60);
        border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); z-index: 10; display: none;
    }
    .bsp-status-dot.offline { background: radial-gradient(circle at 30% 30%, #e74c3c, #c0392b); }

    .bsp-flag {
        position: absolute; top: 75px; left: 20px; width: 45px; height: 30px;
        background-color: #fff; background-image: linear-gradient(to bottom, #fff 50%, #dc143c 50%);
        border: 2px solid white; border-radius: 6px; box-shadow: 0 3px 5px rgba(0,0,0,0.2); z-index: 5;
    }

    #other-player-preview-canvas { position: absolute; top: 60px; left: 0; width: 100%; height: 100%; z-index: 1; }

    .bsp-corner-btn {
        position: absolute; bottom: 15px; width: 60px; height: 60px; border-radius: 12px; border: 3px solid white;
        cursor: pointer; display: flex; flex-direction: column; justify-content: center; align-items: center;
        box-shadow: 0 5px 0 rgba(0,0,0,0.3); transition: transform 0.1s; z-index: 10;
    }
    .bsp-corner-btn:active { transform: translateY(4px); box-shadow: none; }

    .btn-report {
        left: 15px; background: #535c68; background-image: url('icons/alert.png');
        background-size: 60%; background-repeat: no-repeat; background-position: center;
    }
    .btn-report::after { content: '⚠️'; font-size: 30px; }

    .btn-friend-action {
        right: 15px; background: linear-gradient(to bottom, #e74c3c, #c0392b);
    }
    .friend-icon-placeholder { font-size: 30px; filter: drop-shadow(1px 1px 0 #000); }

    .bsp-sidebar { display: flex; flex-direction: column; gap: 8px; padding-top: 10px; }

    .bsp-side-btn {
        width: 100px; height: 75px; background: linear-gradient(to bottom, #4facfe, #00f2fe);
        border: 3px solid white; border-radius: 15px; display: flex; flex-direction: column;
        justify-content: center; align-items: center; box-shadow: 0 5px 0 #2980b9, 0 8px 10px rgba(0,0,0,0.3);
        cursor: pointer; transition: transform 0.1s; position: relative;
    }
    .bsp-side-btn:active { transform: translateY(4px); box-shadow: 0 1px 0 #2980b9; }
    
    .bsp-side-btn.green {
        background: linear-gradient(to bottom, #2ecc71, #27ae60); box-shadow: 0 5px 0 #1e8449, 0 8px 10px rgba(0,0,0,0.3);
    }
    .bsp-side-btn.green:active { transform: translateY(4px); box-shadow: 0 1px 0 #1e8449; }

    .bsp-btn-icon {
        width: 35px; height: 35px; background-size: contain; background-repeat: no-repeat; background-position: center;
        filter: drop-shadow(0 2px 0 rgba(0,0,0,0.2)); margin-bottom: 2px;
    }
    .bsp-btn-label { font-size: 13px; color: white; text-shadow: 1.5px 1.5px 0 #000; font-weight: bold; }

    .bsp-close-x {
        position: absolute; top: -15px; right: -15px; width: 40px; height: 40px; background: #e74c3c;
        border: 3px solid white; border-radius: 50%; color: white; font-size: 20px; font-weight: bold;
        display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 20;
        box-shadow: 0 3px 5px rgba(0,0,0,0.3);
    }

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
            <div class="bsp-main-card">
                <div class="bsp-close-x" id="btn-other-profile-close">X</div>
                <div class="bsp-level-star"><span id="other-profile-level" style="transform: rotate(10deg); margin-top:5px;">100</span></div>
                <div id="other-profile-status" class="bsp-status-dot"></div>
                <div class="bsp-header">
                    <div id="other-profile-username" class="bsp-username">cybervamp</div>
                    <div id="other-profile-date" class="bsp-joined">Członek od maj, 2024</div>
                </div>
                <div class="bsp-flag"></div>
                <div id="other-player-preview-canvas"></div>
                <div class="bsp-corner-btn btn-report"></div>
                <div id="btn-other-friend-action" class="bsp-corner-btn btn-friend-action">
                    <div class="friend-icon-placeholder">👤🗑️</div>
                </div>
            </div>
            <div class="bsp-sidebar">
                <div id="btn-other-wall" class="bsp-side-btn">
                    <div class="bsp-btn-icon" style="background-image: url('icons/icon-like.png');"></div>
                    <div class="bsp-btn-label">Ściana</div>
                </div>
                <div id="btn-other-chat" class="bsp-side-btn">
                    <div class="bsp-btn-icon" style="background-image: url('icons/icon-chat.png');"></div>
                    <div class="bsp-btn-label">Czat</div>
                </div>
                <div id="btn-other-smile" class="bsp-side-btn">
                    <div class="bsp-btn-icon" style="background-image: url('icons/usmiech.png');">🎉</div> 
                    <div class="bsp-btn-label">Uśmiech</div>
                </div>
                <div class="bsp-side-btn green">
                    <div class="bsp-btn-icon" style="background-image: url('icons/gamepad.png');">🎮</div>
                    <div class="bsp-btn-label">Zaproś</div>
                </div>
                <div class="bsp-side-btn">
                    <div class="bsp-btn-icon" style="background-image: url('icons/icon-home.png');"></div>
                    <div class="bsp-btn-label">Dom</div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

// W TEJ WERSJI USUNIĘTO JUŻ: #shop-panel, #play-choice-panel, #build-choice-panel, #more-options-panel
export const MODALS_HTML = `
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

    <!-- PANELE NAWIGACYJNE ZOSTAŁY PRZENIESIONE DO NAVIGATION_MANAGER.JS -->
    <!-- PANEL SKLEPU ZOSTAŁ PRZENIESIONY DO SHOP_MANAGER.JS -->

    <div id="discover-panel" class="panel-modal"><div class="panel-content"><div class="friends-tabs" id="discover-tabs" style="display:none"><div class="friends-tab active" data-tab="all">Wszystkie</div><div class="friends-tab" data-tab="mine">Moje</div></div><h2 id="discover-panel-title">Wybierz</h2><div id="discover-list" class="panel-list"></div><button id="discover-close-button" class="panel-close-button">Zamknij</button></div></div>
    
    <div id="world-size-panel" class="panel-modal"><div class="panel-content"><h2>Rozmiar</h2><div class="build-choice-grid"><div id="size-choice-new-small" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-smallworld.png');"></div><span>Mały</span></div><div id="size-choice-new-medium" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-mediumworld.png');"></div><span>Średni</span></div><div id="size-choice-new-large" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-bigworld.png');"></div><span>Duży</span></div></div><button class="panel-close-button">Anuluj</button></div></div>
    <div id="add-choice-panel" class="panel-modal"><div class="panel-content"><h2>Dodaj</h2><div class="panel-list"><div id="add-choice-blocks" class="panel-item">Bloki</div><div id="add-choice-prefabs" class="panel-item">Prefabrykaty</div><div id="add-choice-parts" class="panel-item">Części</div></div><button id="add-choice-close" class="panel-close-button">Anuluj</button></div></div>
    <div id="player-preview-panel" class="panel-modal"><div class="panel-content"><h2>Podgląd</h2><div id="player-preview-renderer-container"></div><button class="panel-close-button">Zamknij</button></div></div>
    
    <div id="name-input-panel" class="panel-modal"><div id="name-input-panel-container"><h2>Nick</h2><input id="name-input-field"><button id="name-submit-btn">OK</button></div></div>
`;