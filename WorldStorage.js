const WORLDS_STORAGE_KEY = 'bsp_clone_worlds';

export class WorldStorage {

  static saveWorld(worldName, blocksData) {
    if (!worldName || worldName.trim() === '') {
      alert('Nazwa świata nie może być pusta!');
      return false;
    }
    const worlds = this.getAllWorlds();
    worlds[worldName] = blocksData;
    try {
      localStorage.setItem(WORLDS_STORAGE_KEY, JSON.stringify(worlds));
      console.log(`World "${worldName}" saved successfully!`);
      return true;
    } catch (error) {
      console.error('Error saving world to localStorage:', error);
      alert('Nie udało się zapisać świata. Pamięć przeglądarki może być pełna.');
      return false;
    }
  }

  static loadWorld(worldName) {
    const worlds = this.getAllWorlds();
    return worlds[worldName] || null;
  }

  static getSavedWorldsList() {
    const worlds = this.getAllWorlds();
    return Object.keys(worlds);
  }

  static getAllWorlds() {
    try {
      const worldsData = localStorage.getItem(WORLDS_STORAGE_KEY);
      return worldsData ? JSON.parse(worldsData) : {};
    } catch (error) {
      console.error('Error reading worlds from localStorage:', error);
      return {};
    }
  }
}