const WORLDS_STORAGE_KEY = 'bsp_clone_worlds';

export class WorldStorage {

  static saveWorld(worldName, worldData) {
    if (!worldName || worldName.trim() === '') {
      alert('Nazwa świata nie może być pusta!');
      return false;
    }
    const worlds = this.getAllWorlds();
    // worldData zawiera teraz { size, blocks, thumbnail }
    worlds[worldName] = worldData;
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
    const data = worlds[worldName];
    
    // Obsługa wsteczna (gdyby ktoś miał stary format, co jest mało prawdopodobne w tym projekcie, ale bezpieczniej)
    if (Array.isArray(data)) {
        // Stary format to była tablica bloków
        return { size: 64, blocks: data };
    }
    return data || null;
  }
  
  // NOWA METODA
  static getThumbnail(worldName) {
      const worlds = this.getAllWorlds();
      const data = worlds[worldName];
      if (data && data.thumbnail) {
          return data.thumbnail;
      }
      return null;
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