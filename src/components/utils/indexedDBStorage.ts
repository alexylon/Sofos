const DB_NAME = 'SofosStorage';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

let dbPromise: Promise<IDBDatabase> | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
	if (typeof window === 'undefined') {
		return Promise.reject(new Error('IndexedDB is not available in this environment.'));
	}

	if (!dbPromise) {
		dbPromise = new Promise((resolve, reject) => {
			const request = window.indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				reject(request.error ?? new Error('Failed to open IndexedDB.'));
			};

			request.onupgradeneeded = () => {
				const db = request.result;

				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME);
				}
			};

			request.onsuccess = () => {
				resolve(request.result);
			};
		});
	}

	return dbPromise;
};

const runTransaction = async <T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
	const db = await openDatabase();
	const transaction = db.transaction(STORE_NAME, mode);
	const store = transaction.objectStore(STORE_NAME);

	return new Promise<T>((resolve, reject) => {
		let requestResult: T;
		const request = callback(store);

		request.onsuccess = () => {
			requestResult = request.result as T;
		};

		request.onerror = () => {
			reject(request.error ?? new Error('IndexedDB request failed.'));
		};

		transaction.oncomplete = () => {
			resolve(requestResult);
		};

		transaction.onerror = () => {
			reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
		};

		transaction.onabort = () => {
			reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
		};
	});
};

export const indexedDBStorage = {
	async getItem<T = unknown>(key: string): Promise<T | null> {
		try {
			const result = await runTransaction<T | null>('readonly', store => store.get(key));
			return (result ?? null) as T | null;
		} catch (error) {
			console.error('IndexedDB getItem error:', error);
			return null;
		}
	},

	async setItem<T>(key: string, value: T): Promise<void> {
		try {
			await runTransaction('readwrite', store => store.put(value, key));
		} catch (error) {
			console.error('IndexedDB setItem error:', error);
		}
	},

	async removeItem(key: string): Promise<void> {
		try {
			await runTransaction('readwrite', store => store.delete(key));
		} catch (error) {
			console.error('IndexedDB removeItem error:', error);
		}
	},

	async clear(): Promise<void> {
		try {
			await runTransaction('readwrite', store => store.clear());
		} catch (error) {
			console.error('IndexedDB clear error:', error);
		}
	},
};
