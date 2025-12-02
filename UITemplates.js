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

export const MODALS_HTML = `
    <div id="explore-exit-button"></div>
    <div id="victory-panel">
        <div class="victory-title text-outline">Parkour Ukończony!</div>
        <div class="victory-time text-outline" id="victory-time-display">00:00.00</div>
        <button id="victory-super-btn" class="victory-btn">Super!</button>
    </div>
    <div id="reward-panel">
        <h1 class="text-outline">Otrzymujesz:</h1>
        <div class="reward-box-container">
            <div class="reward-box">
                <div class="reward-title text-outline">Bez VIP</div>
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
    <div id="friends-panel" class="panel-modal"><div class="panel-content"><div class="friends-tabs"><div class="friends-tab active" data-tab="friends-list">Lista</div><div class="friends-tab" data-tab="friends-requests">Zaproszenia</div><div class="friends-tab" data-tab="friends-search">Szukaj</div></div><div id="friends-list" class="friends-view active"></div><div id="friends-requests" class="friends-view"></div><div id="friends-search" class="friends-view"><div id="friends-search-bar"><input id="friends-search-input" placeholder="Szukaj..."><button id="friends-search-btn">Szukaj</button></div><div id="friends-search-results"></div></div><button class="panel-close-button">Zamknij</button></div></div>
    <div id="mail-panel" class="panel-modal"><div class="panel-content"><div class="mail-sidebar"><div class="mail-sidebar-header"><h3>Wiadomości</h3><div id="new-mail-btn">+</div></div><div class="mail-conversations"></div></div><div class="mail-chat-view"><div id="mail-chat-header"><h2 id="mail-chat-username">Czat</h2></div><div class="mail-chat-messages"></div><form id="mail-reply-form"><input id="mail-reply-input"><button id="mail-reply-btn">Wyślij</button></form></div><div id="new-mail-composer" style="display:none;"><h2 class="text-outline" style="margin-bottom:20px;">Nowa wiadomość</h2><form id="new-mail-form"><input id="new-mail-recipient" placeholder="Do kogo?"><input id="new-mail-text" placeholder="Treść"><button>Wyślij</button></form></div><button class="panel-close-button" style="position:absolute;top:10px;right:10px;">X</button></div></div>
    <div id="discover-panel" class="panel-modal"><div class="panel-content"><div class="friends-tabs" id="discover-tabs" style="display:none"><div class="friends-tab active" data-tab="all">Wszystkie</div><div class="friends-tab" data-tab="mine">Moje</div></div><h2 id="discover-panel-title">Wybierz</h2><div id="discover-list" class="panel-list"></div><button id="discover-close-button" class="panel-close-button">Zamknij</button></div></div>
    <div id="build-choice-panel" class="panel-modal"><div class="panel-content"><h2>Co budujemy?</h2><div class="build-choice-grid"><div id="build-choice-new-skin" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-newhypercube.png');"></div><span class="build-choice-label text-outline">Nowa HyperCube</span></div><div id="build-choice-new-world" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-newworld.png');"></div><span class="build-choice-label text-outline">Nowy Świat</span></div><div id="build-choice-new-prefab" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-newprefab.png');"></div><span class="build-choice-label text-outline">Nowy Prefabrykat</span></div><div id="build-choice-new-part" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-newhypercubepart.png');"></div><span class="build-choice-label text-outline">Nowa Część HyperCube</span></div></div><button class="panel-close-button">Anuluj</button></div></div>
    <div id="world-size-panel" class="panel-modal"><div class="panel-content"><h2>Rozmiar</h2><div class="build-choice-grid"><div id="size-choice-new-small" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-smallworld.png');"></div><span>Mały</span></div><div id="size-choice-new-medium" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-mediumworld.png');"></div><span>Średni</span></div><div id="size-choice-new-large" class="build-choice-item"><div class="build-choice-icon" style="background-image: url('icons/icon-bigworld.png');"></div><span>Duży</span></div></div><button class="panel-close-button">Anuluj</button></div></div>
    <div id="shop-panel" class="panel-modal"><div class="panel-content"><h2>Sklep</h2><div class="friends-tabs" style="margin-bottom:15px;"><div class="friends-tab active" id="shop-tab-blocks">Bloki</div><div class="friends-tab" id="shop-tab-addons">Dodatki</div></div><div id="shop-list" class="panel-list"></div><button class="panel-close-button">Zamknij</button></div></div>
    <div id="add-choice-panel" class="panel-modal"><div class="panel-content"><h2>Dodaj</h2><div class="panel-list"><div id="add-choice-blocks" class="panel-item">Bloki</div><div id="add-choice-prefabs" class="panel-item">Prefabrykaty</div><div id="add-choice-parts" class="panel-item">Części</div></div><button id="add-choice-close" class="panel-close-button">Anuluj</button></div></div>
    <div id="player-preview-panel" class="panel-modal"><div class="panel-content"><h2>Podgląd</h2><div id="player-preview-renderer-container"></div><button class="panel-close-button">Zamknij</button></div></div>
    <div id="more-options-panel" class="panel-modal"><div class="panel-content"><h2>Opcje</h2><div class="panel-list"><div id="toggle-fps-btn" class="panel-item">Licznik FPS: <span id="fps-status">Wyłączony</span></div><div id="logout-btn" class="panel-item btn-danger">Wyloguj</div></div><button class="panel-close-button">Zamknij</button></div></div>
    <div id="name-input-panel" class="panel-modal"><div id="name-input-panel-container"><h2>Nick</h2><input id="name-input-field"><button id="name-submit-btn">OK</button></div></div>
    
    <!-- --- NOWY MODAL SZCZEGÓŁÓW SKINA --- -->
    <div id="skin-details-modal" class="panel-modal">
        <div class="skin-details-content">
            <div class="skin-details-left">
                <div id="skin-creator-card">
                    <div id="skin-creator-avatar"></div>
                    <div class="creator-info">
                        <div id="skin-creator-name" class="text-outline">Twórca</div>
                        <div id="skin-time-ago" class="text-outline">0 dni temu</div>
                    </div>
                    <div class="creator-level">
                        <div class="level-star-small"><span id="skin-creator-level" class="text-outline">1</span></div>
                    </div>
                </div>
                <div class="skin-stats-card">
                    <div class="like-icon-big">👍</div>
                    <div id="skin-likes-count" class="text-outline">0</div>
                </div>
            </div>
            
            <div class="skin-details-center">
                <div id="skin-name-header" class="text-outline">Nazwa Skina</div>
                <div id="skin-3d-container"></div>
            </div>
            
            <div class="skin-details-right">
                <button id="skin-share-btn" class="skin-action-btn"><img src="icons/icon-share.png"> Udostępnij</button>
                <button id="skin-like-btn" class="skin-action-btn"><img src="icons/icon-like.png"> Polub</button>
                <button id="skin-wear-btn" class="skin-action-btn" style="background-color:#2ecc71"><img src="icons/icon-wear.png"> Użyj</button>
                <button id="skin-comments-btn" class="skin-action-btn"><img src="icons/logo-poczta.png"> <span id="skin-comments-count">0</span></button>
            </div>

            <button class="panel-close-button" style="position:absolute; top:10px; right:10px;">X</button>
        </div>
    </div>
`;