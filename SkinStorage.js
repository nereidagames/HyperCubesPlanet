const SKINS_STORAGE_KEY = 'bsp_clone_skins';
const LAST_SKIN_KEY = 'bsp_clone_last_skin';

export class SkinStorage {

  static saveSkin(skinName, blocksData) {
    if (!skinName || skinName.trim() === '') {
      alert('Nazwa skina nie może być pusta!');
      return false;
    }
    const skins = this.getAllSkins();
    skins[skinName] = blocksData;
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
    return skins[skinName] || null;
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