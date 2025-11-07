const PARTS_STORAGE_KEY = 'bsp_clone_hypercube_parts';

export class HyperCubePartStorage {

  static savePart(partName, blocksData) {
    if (!partName || partName.trim() === '') {
      alert('Nazwa części nie może być pusta!');
      return false;
    }
    const parts = this.getAllParts();
    parts[partName] = blocksData;
    try {
      localStorage.setItem(PARTS_STORAGE_KEY, JSON.stringify(parts));
      console.log(`HyperCube Part "${partName}" saved successfully!`);
      return true;
    } catch (error) {
      console.error('Error saving part to localStorage:', error);
      alert('Nie udało się zapisać części. Pamięć przeglądarki może być pełna.');
      return false;
    }
  }

  static loadPart(partName) {
    const parts = this.getAllParts();
    return parts[partName] || null;
  }

  static getSavedPartsList() {
    const parts = this.getAllParts();
    return Object.keys(parts);
  }

  static getAllParts() {
    try {
      const partsData = localStorage.getItem(PARTS_STORAGE_KEY);
      return partsData ? JSON.parse(partsData) : {};
    } catch (error) {
      console.error('Error reading parts from localStorage:', error);
      return {};
    }
  }
}
