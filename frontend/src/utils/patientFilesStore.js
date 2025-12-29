const DB_NAME = 'zenlink-files';
const DB_VERSION = 1;
const STORE_NAME = 'patientFiles';

function hasIndexedDb() {
  return typeof indexedDB !== 'undefined';
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) return reject(new Error('IndexedDB not available'));

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function keyFor(userId, fileId) {
  return `${String(userId)}:${String(fileId)}`;
}

export async function putPatientFileContent(userId, fileId, dataUrl) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
    tx.oncomplete = () => resolve();
    const store = tx.objectStore(STORE_NAME);
    store.put(dataUrl, keyFor(userId, fileId));
  });
}

export async function getPatientFileContent(userId, fileId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    tx.onerror = () => reject(tx.error || new Error('IndexedDB read failed'));
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(keyFor(userId, fileId));
    req.onerror = () => reject(req.error || new Error('IndexedDB read failed'));
    req.onsuccess = () => resolve(req.result || null);
  });
}

export async function deletePatientFileContent(userId, fileId) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.onerror = () => reject(tx.error || new Error('IndexedDB delete failed'));
    tx.oncomplete = () => resolve();
    const store = tx.objectStore(STORE_NAME);
    store.delete(keyFor(userId, fileId));
  });
}



