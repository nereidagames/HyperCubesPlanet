const PARTS_STORAGE_KEY = 'bsp_clone_hypercube_parts';

export class HyperCubePartStorage {

  // Dodano parametr thumbnail
  static savePart(partName, blocksData, thumbnail = null) {
    if (!partName || partName.trim() === '') {
      alert('Nazwa części nie może być pusta!');
      return false;
    }
    const parts = this.getAllParts();
    
    // Zapisujemy obiekt zamiast samej tablicy
    parts[partName] = {
        blocks: blocksData,
        thumbnail: thumbnail
    };

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
    const data = parts[partName];
    if (!data) return null;

    // Kompatybilność wsteczna (jeśli stary zapis to tablica)
    if (Array.isArray(data)) {
        return data;
    } else {
        return data.blocks;
    }
  }
  
  // Nowa metoda do pobierania miniaturki
  static getThumbnail(partName) {
      const parts = this.getAllParts();
      const data = parts[partName];
      if (data && !Array.isArray(data) && data.thumbnail) {
          return data.thumbnail;
      }
      return null;
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