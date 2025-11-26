const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

export const BLOCK_DEFINITIONS = [
    { name: 'Ziemia', texturePath: 'textures/ziemia.png', cost: 0 },
    { name: 'Trawa', texturePath: 'textures/trawa.png', cost: 250 },
    { name: 'Drewno', texturePath: 'textures/drewno.png', cost: 750 },
    { name: 'Piasek', texturePath: 'textures/piasek.png', cost: 500 },
    { name: 'Beton', texturePath: 'textures/beton.png', cost: 1200 }
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
        // FIX: Jeśli przyjdzie string (z JSONB), parsuj go
        if (typeof blocksArray === 'string') {
            try {
                blocksArray = JSON.parse(blocksArray);
            } catch (e) {
                console.error("Błąd parsowania bloków:", e);
                blocksArray = [];
            }
        }

        if (Array.isArray(blocksArray)) {
            this.ownedBlocks = new Set(blocksArray);
            console.log("Zaktualizowano posiadane bloki:", this.ownedBlocks);
        } else {
            console.warn("Otrzymano niepoprawne dane o blokach:", blocksArray);
        }
    }

    isOwned(blockName) {
        return this.ownedBlocks.has(blockName);
    }

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

    getOwnedBlockTypes() {
        return BLOCK_DEFINITIONS.filter(block => this.isOwned(block.name));
    }

    getAllBlockDefinitions() {
        return BLOCK_DEFINITIONS;
    }
}