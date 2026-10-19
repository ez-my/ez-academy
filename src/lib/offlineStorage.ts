import { get, set } from 'idb-keyval';
import { ReadTestSet, ListenTestSet } from '../types';

const OFFLINE_READ_KEY = 'offline_read_tests';
const OFFLINE_LISTEN_KEY = 'offline_listen_tests';

export async function saveReadTestOffline(test: ReadTestSet) {
  const current = (await get<ReadTestSet[]>(OFFLINE_READ_KEY)) || [];
  current.push(test);
  await set(OFFLINE_READ_KEY, current);
}

export async function getOfflineReadTests(): Promise<ReadTestSet[]> {
  return (await get<ReadTestSet[]>(OFFLINE_READ_KEY)) || [];
}

export async function saveListenTestOffline(test: ListenTestSet) {
  const current = (await get<ListenTestSet[]>(OFFLINE_LISTEN_KEY)) || [];
  current.push(test);
  await set(OFFLINE_LISTEN_KEY, current);
}

export async function getOfflineListenTests(): Promise<ListenTestSet[]> {
  return (await get<ListenTestSet[]>(OFFLINE_LISTEN_KEY)) || [];
}

export async function hasOfflineReadTests(): Promise<boolean> {
  const tests = await getOfflineReadTests();
  return tests.length > 0;
}

export async function hasOfflineListenTests(): Promise<boolean> {
  const tests = await getOfflineListenTests();
  return tests.length > 0;
}
