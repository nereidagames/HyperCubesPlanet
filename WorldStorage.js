const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';
const JWT_TOKEN_KEY = 'bsp_clone_jwt_token';

export class WorldStorage {

  // Zapisz świat na serwerze
  static async saveWorld(worldName, worldData) {
    if (!worldName) return false;
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    
    if (!token) {
        alert("Nie jesteś zalogowany! Nie można zapisać świata.");
        return false;
    }

    // worldData to obiekt zawierający: { size, blocks, thumbnail }
    // Oddzielamy miniaturkę, aby wysłać ją do odpowiedniej kolumny w bazie
    const thumbnail = worldData.thumbnail;
    
    // Tworzymy kopię danych bez miniaturki (żeby nie dublować danych w bazie i nie zapychać JSONa)
    const dataToSave = { ...worldData };
    delete dataToSave.thumbnail; 

    try {
        const response = await fetch(`${API_BASE_URL}/api/worlds`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                name: worldName, 
                world_data: dataToSave, 
                thumbnail: thumbnail 
            })
        });

        if (response.ok) {
            console.log(`World "${worldName}" saved to server!`);
            return true;
        } else {
            const err = await response.json();
            console.error("Błąd zapisu świata:", err);
            alert(`Nie udało się zapisać: ${err.message}`);
            return false;
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert("Błąd sieci.");
        return false;
    }
  }

  // Pobierz PEŁNE dane konkretnego świata (klocki) - używane przy wchodzeniu do świata
  static async loadWorldData(worldId) {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/api/worlds/${worldId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            // Serwer zwraca sam obiekt JSON z kolumny world_data
            return await response.json(); 
        } else {
            console.error("Błąd pobierania świata:", response.status);
        }
    } catch (error) {
        console.error('Error loading world:', error);
    }
    return null;
  }

  // Pobierz LISTĘ wszystkich światów (tylko nazwy i miniaturki) - używane w menu "Zagraj"
  static async getAllWorlds() {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/worlds/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            return await response.json();
        }
    } catch(e) { 
        console.error("Błąd pobierania listy:", e);
    }
    return [];
  }
  
  // Metoda pomocnicza do wyciągania miniaturki z obiektu listy
  static getThumbnail(worldObj) {
      // worldObj to teraz obiekt z bazy: { id, name, thumbnail, creator... }
      if (worldObj && worldObj.thumbnail) {
          return worldObj.thumbnail;
      }
      return null;
  }

  // Metody kompatybilności (żeby stary kod się nie wywalił, zanim go podmienimy)
  static loadWorld(name) { return null; }
  static getSavedWorldsList() { return []; }
}