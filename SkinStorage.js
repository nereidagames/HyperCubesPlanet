const API_BASE_URL = 'https://hypercubes-nexus-server.onrender.com';
const LAST_SKIN_ID_KEY = 'bsp_clone_last_skin_id'; // Zmieniono klucz na ID
const JWT_TOKEN_KEY = 'bsp_clone_jwt_token';

export class SkinStorage {

  // Zapisz skin na serwerze
  static async saveSkin(skinName, blocksData, thumbnail = null) {
    if (!skinName || skinName.trim() === '') {
      alert('Nazwa skina nie może być pusta!');
      return false;
    }
    
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/api/skins`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                name: skinName, 
                blocks: blocksData, 
                thumbnail: thumbnail 
            })
        });

        if (response.ok) {
            console.log(`Skin "${skinName}" saved to server!`);
            return true;
        } else {
            console.error("Błąd zapisu skina");
            return false;
        }
    } catch (error) {
        console.error('Error saving skin:', error);
        alert('Błąd sieci podczas zapisywania.');
        return false;
    }
  }

  // Pobierz konkretnego skina (jego bloki) z serwera
  static async loadSkinData(skinId) {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/api/skins/${skinId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            return await response.json(); // Zwraca tablicę bloków
        }
    } catch (error) {
        console.error('Error loading skin:', error);
    }
    return null;
  }

  // Pobierz listę MOICH skinów (meta dane: nazwa, id, miniaturka)
  static async getMySkins() {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/skins/mine`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    } catch(e) { return []; }
  }

  // Pobierz listę WSZYSTKICH skinów
  static async getAllSkins() {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/skins/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok ? await response.json() : [];
    } catch(e) { return []; }
  }
  
  // Lokalne zapisywanie ID ostatnio używanego skina
  static setLastUsedSkinId(skinId) {
      localStorage.setItem(LAST_SKIN_ID_KEY, skinId);
  }
  
  static getLastUsedSkinId() {
      return localStorage.getItem(LAST_SKIN_ID_KEY);
  }
  
  // Metody kompatybilności (nieużywane w nowej wersji, ale zostawione by nie wywalić błędów w starym kodzie jeśli coś zostało)
  static loadSkin(skinName) { return null; }
  static getThumbnail(skinName) { return null; }
  static getSavedSkinsList() { return []; }
}