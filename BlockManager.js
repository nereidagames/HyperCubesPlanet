/* PLIK: BlockManager.js */
const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export const BLOCK_DEFINITIONS = [
    // --- STARE BLOKI (TERAZ DARMOWE - OD POCZĄTKU) ---
    { name: 'Ziemia', texturePath: 'textures/ziemia.png', cost: 0, category: 'block' },
    { name: 'Trawa', texturePath: 'textures/trawa.png', cost: 0, category: 'block' },
    { name: 'Drewno', texturePath: 'textures/drewno.png', cost: 0, category: 'block' },
    { name: 'Piasek', texturePath: 'textures/piasek.png', cost: 0, category: 'block' },
    { name: 'Beton', texturePath: 'textures/beton.png', cost: 0, category: 'block' },
    
    // --- NOWE BLOKI (DO KUPIENIA) ---
    { name: 'Gładki', texturePath: 'textures/gladki.png', cost: 150, category: 'block' },
    { name: 'Karton', texturePath: 'textures/karton.png', cost: 200, category: 'block' },
    { name: 'Dżins', texturePath: 'textures/dzins.png', cost: 300, category: 'block' },
    { name: 'Kamień', texturePath: 'textures/kamien.png', cost: 400, category: 'block' },
    { name: 'Drewniana podłoga', texturePath: 'textures/drewnianapodloga.png', cost: 450, category: 'block' },
    { name: 'Bruk', texturePath: 'textures/bruk.png', cost: 450, category: 'block' },
    { name: 'Cegła', texturePath: 'textures/cegla.png', cost: 500, category: 'block' },
    { name: 'Otoczak', texturePath: 'textures/otoczak.png', cost: 550, category: 'block' },
    { name: 'Metalowa siatka', texturePath: 'textures/metalowasiatka.png', cost: 600, category: 'block' },
    { name: 'Metalowa płyta', texturePath: 'textures/metalowaplyta.png', cost: 800, category: 'block' },
    { name: 'Granit', texturePath: 'textures/granit.png', cost: 900, category: 'block' },
    { name: 'Cukierek', texturePath: 'textures/cukierek.png', cost: 1200, category: 'block' },

    // --- DODATKI (Parkour) ---
    { name: 'Parkour Start', texturePath: 'textures/beton.png', cost: 1000, category: 'addon' }, 
    { name: 'Parkour Meta', texturePath: 'textures/drewno.png', cost: 1000, category: 'addon' }
];

export class BlockManager {
    constructor() {
        this.ownedBlocks = new Set();
    }

    // Ta metoda ładuje darmowe bloki na start sesji
    load() {
        BLOCK_DEFINITIONS.forEach(block => {
            if (block.cost === 0) {
                this.ownedBlocks.add(block.name);
            }
        });
    }

    setOwnedBlocks(blocksArray) {
        if (typeof blocksArray === 'string') {
            try {
                blocksArray = JSON.parse(blocksArray);
            } catch (e) {
                blocksArray = [];
            }
        }
        
        // Zawsze dodaj darmowe bloki, nawet jeśli serwer ich nie zwrócił
        BLOCK_DEFINITIONS.forEach(block => {
            if (block.cost === 0) {
                this.ownedBlocks.add(block.name);
            }
        });

        if (Array.isArray(blocksArray)) {
            blocksArray.forEach(b => this.ownedBlocks.add(b));
        }
    }

    isOwned(blockName) {
        return this.ownedBlocks.has(blockName);
    }

    async buyBlock(blockName, cost) {
        if (this.isOwned(blockName)) return { success: false, message: "Już posiadasz ten element." };

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
                this.setOwnedBlocks(data.ownedBlocks);
                return { success: true, newBalance: data.newBalance };
            } else {
                return { success: false, message: data.message || "Błąd zakupu." };
            }
        } catch (error) {
            return { success: false, message: "Błąd sieci." };
        }
    }

    getOwnedBlockTypes() {
        return BLOCK_DEFINITIONS.filter(block => this.isOwned(block.name));
    }

    getOwnedByCategory(category) {
        return BLOCK_DEFINITIONS.filter(block => this.isOwned(block.name) && block.category === category);
    }

    getAllBlockDefinitions() {
        return BLOCK_DEFINITIONS;
    }
}
