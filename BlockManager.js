/* PLIK: BlockManager.js */
const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';

// --- DANE ZDEFINIOWANE POZA KLASĄ (GLOBALNIE W MODULE) ---
// Dzięki temu są dostępne natychmiast i nie mogą zostać nadpisane przez błąd w konstruktorze.
const MASTER_BLOCK_LIST = [
    // --- PODSTAWOWE (0-5) ---
    { id: 1, name: 'Ziemia', texturePath: 'textures/ziemia.png', cost: 0, category: 'block' },
    { id: 2, name: 'Trawa', texturePath: 'textures/trawa.png', cost: 0, category: 'block' },
    { id: 3, name: 'Drewno', texturePath: 'textures/drewno.png', cost: 0, category: 'block' },
    { id: 4, name: 'Piasek', texturePath: 'textures/piasek.png', cost: 0, category: 'block' },
    { id: 5, name: 'Beton', texturePath: 'textures/beton.png', cost: 0, category: 'block' },
    
    // --- SKLEP (6-20) ---
    { id: 6, name: 'Gładki', texturePath: 'textures/gladki.png', cost: 150, category: 'block' },
    { id: 7, name: 'Karton', texturePath: 'textures/karton.png', cost: 200, category: 'block' },
    { id: 8, name: 'Dżins', texturePath: 'textures/dzins.png', cost: 300, category: 'block' },
    { id: 9, name: 'Kamień', texturePath: 'textures/kamien.png', cost: 400, category: 'block' },
    { id: 10, name: 'Drewniana podłoga', texturePath: 'textures/drewnianapodloga.png', cost: 450, category: 'block' },
    { id: 11, name: 'Bruk', texturePath: 'textures/bruk.png', cost: 450, category: 'block' },
    { id: 12, name: 'Cegła', texturePath: 'textures/cegla.png', cost: 500, category: 'block' },
    { id: 13, name: 'Otoczak', texturePath: 'textures/otoczak.png', cost: 550, category: 'block' },
    { id: 14, name: 'Metalowa siatka', texturePath: 'textures/metalowasiatka.png', cost: 600, category: 'block' },
    { id: 15, name: 'Metalowa płyta', texturePath: 'textures/metalowaplyta.png', cost: 800, category: 'block' },
    { id: 16, name: 'Granit', texturePath: 'textures/granit.png', cost: 900, category: 'block' },
    { id: 17, name: 'Cukierek', texturePath: 'textures/cukierek.png', cost: 1200, category: 'block' },

    // --- DODATKI / PARKOUR (100+) ---
    { id: 100, name: 'Parkour Start', texturePath: 'textures/beton.png', cost: 1000, category: 'addon' }, 
    { id: 101, name: 'Parkour Meta', texturePath: 'textures/drewno.png', cost: 1000, category: 'addon' }
];

export class BlockManager {
    constructor() {
        this.ownedBlocks = new Set();
        console.log("BlockManager: Dane załadowane. Ilość:", MASTER_BLOCK_LIST.length);
    }

    // Ta metoda ładuje darmowe bloki na start sesji
    load() {
        MASTER_BLOCK_LIST.forEach(block => {
            if (block.cost === 0) {
                this.ownedBlocks.add(block.name);
            }
        });
    }

    setOwnedBlocks(blocksArray) {
        if (typeof blocksArray === 'string') {
            try { blocksArray = JSON.parse(blocksArray); } catch (e) { blocksArray = []; }
        }
        
        // Zawsze dodaj darmowe bloki
        MASTER_BLOCK_LIST.forEach(block => {
            if (block.cost === 0) this.ownedBlocks.add(block.name);
        });

        if (Array.isArray(blocksArray)) {
            blocksArray.forEach(b => this.ownedBlocks.add(b));
        }
    }

    isOwned(blockName) {
        return this.ownedBlocks.has(blockName);
    }

    // --- METODY KONWERSJI ---

    getIdByTexture(texturePath, blockName) {
        if (blockName === 'Parkour Start') return 100;
        if (blockName === 'Parkour Meta') return 101;
        const block = MASTER_BLOCK_LIST.find(b => b.texturePath === texturePath && b.category !== 'addon');
        return block ? block.id : 1; 
    }

    getTextureById(id) {
        const block = MASTER_BLOCK_LIST.find(b => b.id === id);
        return block ? block.texturePath : 'textures/ziemia.png';
    }
    
    getBlockNameById(id) {
        const block = MASTER_BLOCK_LIST.find(b => b.id === id);
        return block ? block.name : 'Nieznany';
    }

    getBlockById(id) {
        return MASTER_BLOCK_LIST.find(b => b.id === id);
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
        return MASTER_BLOCK_LIST.filter(block => this.isOwned(block.name));
    }

    getOwnedByCategory(category) {
        return MASTER_BLOCK_LIST.filter(block => this.isOwned(block.name) && block.category === category);
    }

    // !!! KLUCZOWA METODA DLA SKLEPU !!!
    getAllBlockDefinitions() {
        // Zwracamy stałą z góry pliku. Nie ma opcji, żeby była pusta.
        return MASTER_BLOCK_LIST;
    }
}
