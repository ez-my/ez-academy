import { get, set, del, keys } from 'idb-keyval';

/**
 * Storage wrapper for binary audio data using IndexedDB.
 * This saves cloud costs and keeps private audio local to the user's browser.
 */
export const audioStorage = {
  async saveAudio(id: string, blob: Blob): Promise<void> {
    await set(`audio-${id}`, blob);
  },

  async getAudio(id: string): Promise<Blob | undefined> {
    return await get(`audio-${id}`);
  },

  async deleteAudio(id: string): Promise<void> {
    await del(`audio-${id}`);
  },

  async listAudioIds(): Promise<string[]> {
    const allKeys = await keys();
    return allKeys
      .filter((k) => typeof k === 'string' && k.startsWith('audio-'))
      .map((k) => (k as string).replace('audio-', ''));
  },
};
