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

    // OPTYMALIZACJA: Usuwamy miniaturkę z wewnątrz obiektu world_data, 
    // bo i tak wysyłamy ją w osobnej kolumnie. To zmniejsza rozmiar zapytania o połowę.
    const dataToSend = { ...worldData };
    delete dataToSend.thumbnail; 

    try {
        const response = await fetch(`${API_BASE_URL}/api/worlds`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                name: worldName, 
                world_data: dataToSend, 
                thumbnail: worldData.thumbnail 
            })
        });

        if (response.ok) {
            console.log(`World "${worldName}" saved to server!`);
            return true;
        } else {
            // Tutaj łapiemy błąd z serwera
            const errData = await response.json();
            console.error("Błąd zapisu świata:", errData);
            alert(`Nie udało się zapisać świata: ${errData.message || response.statusText}`);
            return false;
        }
    } catch (error) {
        console.error('Network Error saving world:', error);
        alert("Błąd sieci. Sprawdź połączenie z internetem.");
        return false;
    }
  }

  // Pobierz dane konkretnego świata
  static async loadWorldData(worldId) {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) {
        alert("Musisz być zalogowany, aby wczytać świat.");
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/worlds/${worldId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            return await response.json(); // Zwraca obiekt world_data
        } else {
            console.error("Błąd wczytywania świata:", response.status);
            return null;
        }
    } catch (error) {
        console.error('Error loading world:', error);
        return null;
    }
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
    } catch(e) { 
        console.error("Błąd pobierania listy światów:", e);
        return []; 
    }
  }
  
  // Metody pomocnicze
  static getThumbnail(worldObj) {
      // worldObj to teraz obiekt z bazy { id, name, thumbnail... }
      if (worldObj && worldObj.thumbnail) {
          return worldObj.thumbnail;
      }
      return null;
  }
  
  // Metody kompatybilności (dla starego kodu, jeśli gdzieś został)
  static loadWorld(name) { return null; }
  static getSavedWorldsList() { return []; }
}