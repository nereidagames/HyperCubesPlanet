const PREFABS_STORAGE_KEY = 'bsp_clone_prefabs';

export class PrefabStorage {

  // Dodano parametr thumbnail
  static savePrefab(prefabName, blocksData, thumbnail = null) {
    if (!prefabName || prefabName.trim() === '') {
      alert('Nazwa prefabrykatu nie może być pusta!');
      return false;
    }
    const prefabs = this.getAllPrefabs();
    
    // Zapisz jako obiekt
    prefabs[prefabName] = {
        blocks: blocksData,
        thumbnail: thumbnail
    };

    try {
      localStorage.setItem(PREFABS_STORAGE_KEY, JSON.stringify(prefabs));
      console.log(`Prefab "${prefabName}" saved successfully!`);
      return true;
    } catch (error) {
      console.error('Error saving prefab to localStorage:', error);
      alert('Nie udało się zapisać prefabrykatu. Pamięć przeglądarki może być pełna.');
      return false;
    }
  }

  static loadPrefab(prefabName) {
    const prefabs = this.getAllPrefabs();
    const data = prefabs[prefabName];
    
    if (!data) return null;

    // Wsteczna kompatybilność
    if (Array.isArray(data)) {
        return data;
    } else {
        return data.blocks;
    }
  }
  
  // Pobieranie miniaturki
  static getThumbnail(prefabName) {
      const prefabs = this.getAllPrefabs();
      const data = prefabs[prefabName];
      if (data && !Array.isArray(data) && data.thumbnail) {
          return data.thumbnail;
      }
      return null;
  }

  static getSavedPrefabsList() {
    const prefabs = this.getAllPrefabs();
    return Object.keys(prefabs);
  }

  static getAllPrefabs() {
    try {
      const prefabsData = localStorage.getItem(PREFABS_STORAGE_KEY);
      return prefabsData ? JSON.parse(prefabsData) : {};
    } catch (error) {
      console.error('Error reading prefabs from localStorage:', error);
      return {};
    }
  }
}