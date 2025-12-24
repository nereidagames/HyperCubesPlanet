/* PLIK: StarterSkins.js */

export const STARTER_SKINS = [
    {
        id: 'preset_classic',
        name: 'Klasyk',
        blocks: [
            // Tułów (Niebieski - Beton)
            { x: 0, y: 0, z: 0, texturePath: 'textures/beton.png' },
            { x: 0, y: 1, z: 0, texturePath: 'textures/beton.png' },
            { x: -0.5, y: 1, z: 0, texturePath: 'textures/beton.png' }, // Ręka L
            { x: 0.5, y: 1, z: 0, texturePath: 'textures/beton.png' },  // Ręka P
            // Głowa (Drewno)
            { x: 0, y: 2, z: 0, texturePath: 'textures/drewno.png' }
        ]
    },
    {
        id: 'preset_nature',
        name: 'Dziki',
        blocks: [
            // Tułów (Ziemia)
            { x: 0, y: 0, z: 0, texturePath: 'textures/ziemia.png' },
            { x: 0, y: 1, z: 0, texturePath: 'textures/trawa.png' },
            // Ręce asymetryczne
            { x: -0.6, y: 0.5, z: 0.2, texturePath: 'textures/trawa.png' },
            { x: 0.6, y: 1.2, z: 0, texturePath: 'textures/drewno.png' },
            // Głowa
            { x: 0, y: 2, z: 0, texturePath: 'textures/trawa.png' },
            { x: 0, y: 3, z: 0, texturePath: 'textures/ziemia.png' } // "Irokez"
        ]
    },
    {
        id: 'preset_sandman',
        name: 'Pustynny',
        blocks: [
            // Szeroki tułów (Piasek)
            { x: 0, y: 0, z: 0, texturePath: 'textures/piasek.png' },
            { x: -0.5, y: 0.5, z: 0, texturePath: 'textures/piasek.png' },
            { x: 0.5, y: 0.5, z: 0, texturePath: 'textures/piasek.png' },
            { x: 0, y: 1, z: 0, texturePath: 'textures/piasek.png' },
            // Głowa
            { x: 0, y: 2, z: 0, texturePath: 'textures/piasek.png' },
            // Oczy/Gogle (Drewno)
            { x: 0.3, y: 2, z: 0.4, texturePath: 'textures/drewno.png' },
            { x: -0.3, y: 2, z: 0.4, texturePath: 'textures/drewno.png' }
        ]
    }
];
