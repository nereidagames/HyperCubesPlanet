const BLOCKS_OWNED_STORAGE_KEY = 'bsp_clone_owned_blocks';

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
        this.ownedBlocks = new Set();
    }

    // Wczytuje posiadane bloki z pamięci lub inicjalizuje darmowe
    load() {
        const savedData = localStorage.getItem(BLOCKS_OWNED_STORAGE_KEY);
        if (savedData) {
            this.ownedBlocks = new Set(JSON.parse(savedData));
        } else {
            // Jeśli nie ma zapisu, odblokuj wszystkie darmowe bloki
            BLOCK_DEFINITIONS.forEach(block => {
                if (block.cost === 0) {
                    this.ownedBlocks.add(block.name);
                }
            });
            this.save();
        }
    }

    // Zapisuje listę posiadanych bloków w pamięci
    save() {
        localStorage.setItem(BLOCKS_OWNED_STORAGE_KEY, JSON.stringify([...this.ownedBlocks]));
    }

    // Sprawdza, czy gracz posiada dany blok
    isOwned(blockName) {
        return this.ownedBlocks.has(blockName);
    }

    // Odblokowuje nowy blok
    unlockBlock(blockName) {
        if (!this.isOwned(blockName)) {
            this.ownedBlocks.add(blockName);
            this.save();
            console.log(`Block unlocked: ${blockName}`);
            return true;
        }
        return false;
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