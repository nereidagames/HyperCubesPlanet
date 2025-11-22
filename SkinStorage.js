const SKINS_STORAGE_KEY = 'bsp_clone_skins';
const LAST_SKIN_KEY = 'bsp_clone_last_skin';

export class SkinStorage {

  // Zaktualizowana metoda saveSkin - przyjmuje teraz thumbnail
  static saveSkin(skinName, blocksData, thumbnail = null) {
    if (!skinName || skinName.trim() === '') {
      alert('Nazwa skina nie może być pusta!');
      return false;
    }
    const skins = this.getAllSkins();
    
    // Zapisujemy jako obiekt, nie samą tablicę
    skins[skinName] = {
        blocks: blocksData,
        thumbnail: thumbnail
    };

    try {
      localStorage.setItem(SKINS_STORAGE_KEY, JSON.stringify(skins));
      console.log(`Skin "${skinName}" saved successfully!`);
      return true;
    } catch (error) {
      console.error('Error saving skin to localStorage:', error);
      alert('Nie udało się zapisać skina. Pamięć przeglądarki może być pełna.');
      return false;
    }
  }

  static loadSkin(skinName) {
    const skins = this.getAllSkins();
    const data = skins[skinName];
    
    if (!data) return null;

    // Obsługa wsteczna (stare zapisy to tablice, nowe to obiekty)
    if (Array.isArray(data)) {
        return data; // Stary format
    } else {
        return data.blocks; // Nowy format
    }
  }
  
  static getThumbnail(skinName) {
      const skins = this.getAllSkins();
      const data = skins[skinName];
      if (data && !Array.isArray(data) && data.thumbnail) {
          return data.thumbnail;
      }
      return null; // Brak miniaturki lub stary format
  }

  static getSavedSkinsList() {
    const skins = this.getAllSkins();
    return Object.keys(skins);
  }

  static getAllSkins() {
    try {
      const skinsData = localStorage.getItem(SKINS_STORAGE_KEY);
      return skinsData ? JSON.parse(skinsData) : {};
    } catch (error) {
      console.error('Error reading skins from localStorage:', error);
      return {};
    }
  }
  
  static setLastUsedSkin(skinName) {
      localStorage.setItem(LAST_SKIN_KEY, skinName);
  }
  
  static getLastUsedSkin() {
      return localStorage.getItem(LAST_SKIN_KEY);
  }
}