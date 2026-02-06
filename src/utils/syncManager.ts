// Offline/Online synchronization manager
import {
  getOrdersLocal,
  saveOrderLocal,
  getClientsLocal,
  saveClientLocal,
  getSyncQueue,
  clearSyncQueue,
  addToSyncQueue
} from './offlineDB';

export class SyncManager {
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  private handleOnline() {
    this.isOnline = true;
    console.log('✅ Application online - Syncing data...');
    this.syncPendingChanges();
  }

  private handleOffline() {
    this.isOnline = false;
    console.log('🔴 Application offline - Changes will be synced when online');
  }

  async syncPendingChanges() {
    if (!this.isOnline) return;

    try {
      const queue = await getSyncQueue();
      
      for (const item of queue) {
        try {
          // Here you would call your Firebase functions to sync
          console.log('Syncing:', item.action, item.data);
          // After successful sync, remove from queue
          await this.removeFromQueue(item.id);
        } catch (error) {
          console.error('Sync failed for:', item.action, error);
          // Will retry on next online event
        }
      }

      await clearSyncQueue();
      console.log('✅ Sync complete');
    } catch (error) {
      console.error('Sync manager error:', error);
    }
  }

  private async removeFromQueue(id: number) {
    const db = (window as any).indexedDB;
    const request = db.open('gestionnaire-db', 1);
    request.onsuccess = (event: any) => {
      const database = event.target.result;
      const transaction = database.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      store.delete(id);
    };
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// Singleton instance
export const syncManager = new SyncManager();
