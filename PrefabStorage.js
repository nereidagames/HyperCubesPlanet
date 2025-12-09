const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';
const JWT_TOKEN_KEY = 'bsp_clone_jwt_token';

export class PrefabStorage {

  static async savePrefab(prefabName, blocksData, thumbnail = null) {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) {
        alert("Musisz być zalogowany, aby zapisać prefabrykat!");
        return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/prefabs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: prefabName, blocks: blocksData, thumbnail })
      });
      
      if (response.ok) {
          console.log(`Prefab "${prefabName}" zapisany na serwerze!`);
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

  static async loadPrefab(prefabId) {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return null;
    try {
        const r = await fetch(`${API_BASE_URL}/api/prefabs/${prefabId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(r.ok) return await r.json();
    } catch(e) { console.error(e); }
    return null;
  }

  // POBIERANIE MOICH
  static async getSavedPrefabsList() {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return [];
    try {
        const r = await fetch(`${API_BASE_URL}/api/prefabs/mine`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(r.ok) return await r.json();
    } catch(e) { console.error(e); }
    return [];
  }

  // --- FIX: POBIERANIE WSZYSTKICH (BRAKOWAŁO TEGO) ---
  static async getAllPrefabs() {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return [];
    try {
        const r = await fetch(`${API_BASE_URL}/api/prefabs/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(r.ok) return await r.json();
    } catch(e) { console.error(e); }
    return [];
  }
}