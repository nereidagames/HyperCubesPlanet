const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

// Centralna definicja wszystkich bloków w grze
export const BLOCK_DEFINITIONS = [
    { name: 'Ziemia', texturePath: 'textures/ziemia.png', cost: 0 },
    { name: 'Trawa', texturePath: 'textures/trawa.png', cost: 250 },
    { name: 'Drewno', texturePath: 'textures/drewno.png', cost: 750 },
    { name: 'Piasek', texturePath: 'textures/piasek.png', cost: 500 },
    { name: 'Beton', texturePath: 'textures/beton.png', cost: 1200 }
];

export class BlockManager {
    constructor() {
        // Przechowujemy stan w pamięci (RAM), a nie w localStorage
        this.ownedBlocks = new Set();
    }

    // Metoda wywoływana po zalogowaniu (otrzymuje listę z serwera)
    load() {
        // W tej wersji nie ładujemy z localStorage.
        // Czekamy aż Main.js wywoła setOwnedBlocks z danymi z serwera.
        // Domyślnie (fallback) mamy tylko darmowe bloki.
        BLOCK_DEFINITIONS.forEach(block => {
            if (block.cost === 0) {
                this.ownedBlocks.add(block.name);
            }
        });
    }

    // Ustawia listę posiadanych bloków (z API)
    setOwnedBlocks(blocksArray) {
        if (Array.isArray(blocksArray)) {
            this.ownedBlocks = new Set(blocksArray);
            console.log("Zaktualizowano posiadane bloki:", this.ownedBlocks);
        }
    }

    // Sprawdza, czy gracz posiada dany blok
    isOwned(blockName) {
        return this.ownedBlocks.has(blockName);
    }

    // Kupowanie bloku przez serwer
    async buyBlock(blockName, cost) {
        if (this.isOwned(blockName)) return { success: false, message: "Już posiadasz ten blok." };

        const token = localStorage.getItem('bsp_clone_jwt_token');
        if (!token) return { success: false, message: "Błąd autoryzacji." };

        try {
            const response = await fetch(`${API_BASE_URL}/api/shop/buy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ blockName, cost })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Aktualizuj stan lokalny po udanym zakupie
                this.setOwnedBlocks(data.ownedBlocks);
                return { success: true, newBalance: data.newBalance };
            } else {
                return { success: false, message: data.message || "Błąd zakupu." };
            }
        } catch (error) {
            console.error("Błąd sieci:", error);
            return { success: false, message: "Błąd sieci." };
        }
    }

    // Zwraca pełne definicje tylko posiadanych bloków
    getOwnedBlockTypes() {
        return BLOCK_DEFINITIONS.filter(block => this.isOwned(block.name));
    }

    // Zwraca definicje wszystkich bloków (dla sklepu)
    getAllBlockDefinitions() {
        return BLOCK_DEFINITIONS;
    }
}