const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export const BLOCK_DEFINITIONS = [
    // ZWYKŁE BLOKI
    { name: 'Ziemia', texturePath: 'textures/ziemia.png', cost: 0, category: 'block' },
    { name: 'Trawa', texturePath: 'textures/trawa.png', cost: 250, category: 'block' },
    { name: 'Drewno', texturePath: 'textures/drewno.png', cost: 750, category: 'block' },
    { name: 'Piasek', texturePath: 'textures/piasek.png', cost: 500, category: 'block' },
    { name: 'Beton', texturePath: 'textures/beton.png', cost: 1200, category: 'block' },
    
    // DODATKI (Parkour) - Pamiętaj o wgraniu tekstur lub użyją placeholderów
    { name: 'Parkour Start', texturePath: 'textures/beton.png', cost: 1000, category: 'addon' }, 
    { name: 'Parkour Meta', texturePath: 'textures/drewno.png', cost: 1000, category: 'addon' }
];

export class BlockManager {
    constructor() {
        this.ownedBlocks = new Set();
    }

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
        if (Array.isArray(blocksArray)) {
            this.ownedBlocks = new Set(blocksArray);
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

    // --- NAPRAWA BŁĘDU ---
    // Ta funkcja jest wymagana przez BuildManager.js
    getOwnedBlockTypes() {
        return BLOCK_DEFINITIONS.filter(block => this.isOwned(block.name));
    }

    // Nowa metoda dla sklepu (filtrowanie po kategorii)
    getOwnedByCategory(category) {
        return BLOCK_DEFINITIONS.filter(block => this.isOwned(block.name) && block.category === category);
    }

    getAllBlockDefinitions() {
        return BLOCK_DEFINITIONS;
    }
}