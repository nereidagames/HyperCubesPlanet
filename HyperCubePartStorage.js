const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';
const JWT_TOKEN_KEY = 'bsp_clone_jwt_token';

export class HyperCubePartStorage {

  static async savePart(partName, blocksData, thumbnail = null) {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) {
        alert("Musisz być zalogowany!");
        return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/parts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: partName, blocks: blocksData, thumbnail })
      });
      
      if (response.ok) {
          console.log(`Część "${partName}" zapisana na serwerze!`);
          return true;
      } else {
          const err = await response.json();
          alert(`Błąd zapisu: ${err.message}`);
          return false;
      }
    } catch (error) {
      console.error('Network Error:', error);
      return false;
    }
  }

  static async loadPart(partId) {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return null;
    try {
        const r = await fetch(`${API_BASE_URL}/api/parts/${partId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(r.ok) return await r.json();
    } catch(e) { console.error(e); }
    return null;
  }

  static async getSavedPartsList() {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return [];
    try {
        const r = await fetch(`${API_BASE_URL}/api/parts/mine`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(r.ok) return await r.json();
    } catch(e) { console.error(e); }
    return [];
  }
  
  // Kompatybilność (dla starego kodu, choć teraz używamy ID)
  static getThumbnail(partObj) {
      return partObj.thumbnail;
  }
}