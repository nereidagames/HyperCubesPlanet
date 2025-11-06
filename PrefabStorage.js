
const PREFABS_STORAGE_KEY = 'bsp_clone_prefabs';

export class PrefabStorage {

  static savePrefab(prefabName, blocksData) {
    if (!prefabName || prefabName.trim() === '') {
      alert('Nazwa prefabrykatu nie może być pusta!');
      return false;
    }
    const prefabs = this.getAllPrefabs();
    prefabs[prefabName] = blocksData;
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
    return prefabs[prefabName] || null;
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
