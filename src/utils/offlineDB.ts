// IndexedDB helper for offline storage
export interface StoredOrder {
  id: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  items: { name: string; quantity: number; price: number; stock: number }[];
  status: 'pending' | 'paid' | 'delivered';
  notes: string;
  total: number;
  date: string;
  synced?: boolean;
}

export interface StoredClient {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  firstOrder: string;
  lastOrder: string;
  synced?: boolean;
}

const DB_NAME = 'gestionnaire-db';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Orders store
      if (!database.objectStoreNames.contains('orders')) {
        const orderStore = database.createObjectStore('orders', { keyPath: 'id' });
        orderStore.createIndex('synced', 'synced', { unique: false });
        orderStore.createIndex('date', 'date', { unique: false });
      }

      // Clients store
      if (!database.objectStoreNames.contains('clients')) {
        const clientStore = database.createObjectStore('clients', { keyPath: 'id' });
        clientStore.createIndex('synced', 'synced', { unique: false });
        clientStore.createIndex('phone', 'phone', { unique: true });
      }

      // Sync queue store
      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// Orders operations
export const saveOrderLocal = async (order: StoredOrder): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    const request = store.put({ ...order, synced: false });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getOrdersLocal = async (): Promise<StoredOrder[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['orders'], 'readonly');
    const store = transaction.objectStore('orders');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const deleteOrderLocal = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['orders'], 'readwrite');
    const store = transaction.objectStore('orders');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Clients operations
export const saveClientLocal = async (client: StoredClient): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clients'], 'readwrite');
    const store = transaction.objectStore('clients');
    const request = store.put({ ...client, synced: false });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getClientsLocal = async (): Promise<StoredClient[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['clients'], 'readonly');
    const store = transaction.objectStore('clients');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

// Sync queue operations
export const addToSyncQueue = async (action: string, data: any): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.add({
      action,
      data,
      timestamp: Date.now()
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getSyncQueue = async (): Promise<any[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const clearSyncQueue = async (): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};
