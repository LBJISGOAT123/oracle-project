// ==========================================
// FILE PATH: /src/utils/IDBStorage.ts
// ==========================================

const DB_NAME = 'GodsWar_DB_V1';
const STORE_NAME = 'SaveData';

export const IDBStorage = {
  // DB 열기 (없으면 생성)
  openDB: (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror = (event: any) => reject(event.target.error);
    });
  },

  // 데이터 저장 (Key-Value)
  setItem: async (key: string, value: any): Promise<void> => {
    const db = await IDBStorage.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // 데이터 불러오기
  getItem: async (key: string): Promise<any> => {
    const db = await IDBStorage.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  // 데이터 삭제
  removeItem: async (key: string): Promise<void> => {
    const db = await IDBStorage.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
};
