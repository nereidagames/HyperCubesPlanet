const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';
const JWT_TOKEN_KEY = 'bsp_clone_jwt_token';

export class WorldStorage {

  // Zapisz świat na serwerze
  static async saveWorld(worldName, worldData) {
    if (!worldName) return false;
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/api/worlds`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                name: worldName, 
                world_data: worldData, // Cały obiekt świata (size, blocks, itp.)
                thumbnail: worldData.thumbnail 
            })
        });

        if (response.ok) {
            console.log(`World "${worldName}" saved to server!`);
            return true;
        } else {
            console.error("Błąd zapisu świata");
            return false;
        }
    } catch (error) {
        console.error('Error saving world:', error);
        return false;
    }
  }

  // Pobierz dane konkretnego świata
  static async loadWorldData(worldId) {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/api/worlds/${worldId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            return await response.json(); // Zwraca obiekt world_data
        }
    } catch (error) {
        console.error('Error loading world:', error);
    }
    return null;
  }

  // Pobierz listę wszystkich światów (do menu Zagraj)
  static async getAllWorlds() {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/worlds/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    } catch(e) { return []; }
  }
  
  // Metody kompatybilności (nieużywane, ale dla bezpieczeństwa)
  static loadWorld(name) { return null; }
  static getThumbnail(name) { return null; }
  static getSavedWorldsList() { return []; }
}