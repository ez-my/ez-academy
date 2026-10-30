import type { PracticeSession } from '../types';
import { withoutRecordingData } from './recordingPrivacy';
import { compareResults } from './resultOrder';
export type ProgressStatus = 'draft' | 'saving' | 'saved' | 'not-synced';
type DeviceStorage = Pick<Storage, 'getItem' | 'setItem'> & Partial<Pick<Storage, 'key' | 'length'>>;
type DraftRecord = { kind: 'draft'; owner: string; epoch: number; id: string; draft: any };
type ResultRecord = { kind: 'result'; version: string; order: number; session: PracticeSession; acknowledged?: boolean };
type RecordValue = DraftRecord | ResultRecord | { kind: 'ack'; version: string };
const MAX_RECORD = 256_000;
const RETRY_BATCH = 20;

/** Each writer owns a draft slot; each result version/ack owns a separate key.
 * No shared read-modify-write index: concurrent tabs cannot erase each other's queue.
 * Draft ownership is a Lamport epoch + UUID tie-break, frozen at mount, not at flush.
 * A stale flush may retain its branch, but can never promote it over a newer owner.
 */
export class PracticeAttempt {
  draft: any = null;
  status: ProgressStatus = 'draft';
  id: string = crypto.randomUUID();
  localDurable = true;
  draftConflict = false;
  private owner = crypto.randomUUID();
  private epoch = 1;
  private prefix: string;
  private legacyKey: string;
  private own = new Map<string, RecordValue>();
  private legacyResults = new Map<string, RecordValue>();
  private pending: PracticeSession | null = null;
  private acknowledged: PracticeSession | null = null;
  private timestamp = 0;
  private inFlight = new Set<string>();

  constructor(public userId: string, public type: PracticeSession['type'], private storage: DeviceStorage, private save: (uid: string, session: PracticeSession) => Promise<void | PracticeSession>, private currentUser: () => string | undefined) {
    this.prefix = `ez-progress-v2:${encodeURIComponent(userId)}:${type}:`;
    this.legacyKey = `ez-progress-v1:${userId}:${type}`;
    const records = this.read();
    for (const [key, record] of records) if (record.kind === 'result' && record.version.startsWith('legacy-')) this.legacyResults.set(key, record);
    const draft = this.activeDraft(records);
    if (draft) { this.id = draft.id; this.draft = draft.draft; this.epoch = draft.epoch + 1; }
    this.restore(records);
  }
  private authorized() { return this.currentUser() === this.userId; }
  private valid(value: any): value is RecordValue {
    if (!value || typeof value !== 'object') return false;
    if (value.kind === 'draft') return typeof value.id === 'string' && value.id.length > 0 && typeof value.owner === 'string' && Number.isSafeInteger(value.epoch) && value.epoch >= 0;
    if (value.kind === 'ack') return typeof value.version === 'string';
    const s = value.session;
    return value.kind === 'result' && typeof value.version === 'string' && Number.isSafeInteger(value.order) && s?.userId === this.userId && s.type === this.type && typeof s.id === 'string' && typeof s.transcript === 'string' && Number.isFinite(s.timestamp) && (s.score == null || typeof s.score === 'number' && Number.isFinite(s.score));
  }
  private read(): Map<string, RecordValue> {
    const records = new Map<string, RecordValue>();
    try {
      // v1 is read-only. Keep unsynced legacy work even if migration/storage fails.
      const raw = this.storage.getItem(this.legacyKey);
      if (raw && raw.length > MAX_RECORD) this.localDurable = false;
      if (raw && raw.length <= MAX_RECORD) {
        let old: any;
        try { old = JSON.parse(raw); } catch { this.localDurable = false; }
        if (old?.userId === this.userId && typeof old.id === 'string') {
          records.set('legacy-draft', { kind: 'draft', owner: 'legacy', epoch: 0, id: old.id, draft: withoutRecordingData(old.draft) });
          for (const [name, session] of [['acknowledged', old.acknowledged], ['pending', old.pending]] as const) {
            if (!session) continue;
            const r: ResultRecord = { kind: 'result', version: `legacy-${name}-${encodeURIComponent(old.id)}`, order: name === 'pending' ? 1 : 0, session: withoutRecordingData(session) as PracticeSession, acknowledged: name === 'acknowledged' };
            if (this.valid(r)) records.set(`result:${r.version}`, r);
          }
        }
      }
      const keys: string[] = [];
      for (let i = 0; i < (this.storage.length ?? 0); i++) { const key = this.storage.key?.(i); if (key?.startsWith(this.prefix)) keys.push(key); }
      for (const key of keys) {
        const raw = this.storage.getItem(key);
        if (!raw || raw.length > MAX_RECORD) { this.localDurable = false; continue; }
        try {
          const record = JSON.parse(raw), suffix = key.slice(this.prefix.length);
          const identity = record?.kind === 'draft' ? `draft:${record.owner}` : `${record?.kind}:${record?.version}`;
          if (this.valid(record) && suffix === identity) records.set(suffix, record);
          else this.localDurable = false;
        }
        catch { this.localDurable = false; }
      }
    } catch { this.localDurable = false; }
    for (const [key, record] of this.own) records.set(key, record);
    return records;
  }
  private put(key: string, record: RecordValue) {
    if (!this.authorized()) return false;
    this.own.set(key, record);
    try {
      // Copy, never delete, legacy completions before the first v2 mutation.
      for (const [legacyKey, legacyRecord] of this.legacyResults) {
        this.storage.setItem(this.prefix + legacyKey, JSON.stringify(legacyRecord));
        this.own.set(legacyKey, legacyRecord);
      }
      this.legacyResults.clear();
      const raw = JSON.stringify(withoutRecordingData(record));
      if (raw.length > MAX_RECORD) throw Error('Device progress record too large');
      this.storage.setItem(this.prefix + key, raw);
      return true;
    } catch { this.localDurable = false; return false; }
  }
  private activeDraft(records: Map<string, RecordValue>) {
    return [...records.values()].filter((r): r is DraftRecord => r.kind === 'draft').sort((a,b) => b.epoch - a.epoch || b.owner.localeCompare(a.owner))[0];
  }
  private results(records = this.read()) {
    const latest = new Map<string, ResultRecord>();
    for (const r of records.values()) if (r.kind === 'result') {
      const previous = latest.get(r.session.id);
      // A stale unscored retry cannot demote already-paid feedback.
      const ranked = (v: ResultRecord) => ({ ...v.session, resultVersion: v.version, resultOrder: v.order });
      if (!previous || compareResults(ranked(r), ranked(previous)) > 0) latest.set(r.session.id, r);
    }
    return latest;
  }
  private isAcknowledged(r: ResultRecord, records: Map<string, RecordValue>) {
    const ack = records.get(`ack:${r.version}`);
    return r.acknowledged || ack?.kind === 'ack' && ack.version === r.version;
  }
  private restore(records = this.read()) {
    const result = this.results(records).get(this.id);
    if (result) {
      this.timestamp = result.session.timestamp;
      if (this.isAcknowledged(result, records)) { this.acknowledged = result.session; this.pending = null; }
      else this.pending = result.session;
    }
    this.status = this.pending ? 'not-synced' : this.acknowledged ? this.acknowledgedStatus() : 'draft';
  }
  private acknowledgedStatus(): ProgressStatus {
    const answer = this.draft?.text ?? this.draft?.transcript;
    return typeof answer === 'string' && this.acknowledged && answer.trim() !== this.acknowledged.transcript ? 'draft' : 'saved';
  }
  writeDraft(draft: any) {
    if (!this.authorized()) return;
    const answer = (value: any) => value?.text ?? value?.transcript;
    // Uncompleted answers have no immutable snapshot yet. Fork on edits so two
    // tabs cannot race distinct answers into the same future completion ID.
    if (answer(draft) !== answer(this.draft) && !this.results().has(this.id)) {
      this.id = crypto.randomUUID(); this.timestamp = 0;
    }
    this.draft = withoutRecordingData(draft);
    this.put(`draft:${this.owner}`, { kind: 'draft', owner: this.owner, epoch: this.epoch, id: this.id, draft: this.draft });
    this.draftConflict = this.activeDraft(this.read())?.owner !== this.owner;
    if (!this.pending && this.acknowledged) this.status = this.acknowledgedStatus();
  }
  acceptsAnswer(transcript: string): boolean { this.restore(); return !this.pending || transcript.trim() === this.pending.transcript; }
  async complete(fields: Partial<PracticeSession>): Promise<boolean> {
    if (!this.authorized()) return false;
    this.restore();
    const transcript = (fields.transcript ?? this.pending?.transcript ?? '').trim();
    if (transcript.replace(/[^a-zA-Z]/g, '').length < 10) return false;
    if (this.pending && transcript !== this.pending.transcript) return false;
    if (this.pending?.score != null && fields.score == null) fields = this.pending;
    const draftAnswer = this.draft?.text ?? this.draft?.transcript ?? '';
    if (!this.pending && !this.acknowledged && transcript !== draftAnswer.trim()) {
      this.id = crypto.randomUUID(); this.timestamp = 0;
      this.writeDraft(this.draft);
    }
    if (!this.pending && this.acknowledged && transcript !== this.acknowledged.transcript) {
      this.id = crypto.randomUUID(); this.timestamp = 0; this.acknowledged = null;
      this.writeDraft(this.draft);
    }
    if (!this.timestamp) this.timestamp = Date.now();
    const session = withoutRecordingData({ score: null, feedback: '', duration: 0, ...this.pending, ...fields, id: this.id, userId: this.userId, type: this.type, timestamp: this.timestamp, transcript }) as PracticeSession;
    if (!this.own.has(`draft:${this.owner}`)) this.writeDraft(this.draft);
    const records = this.read();
    const result: ResultRecord = { kind: 'result', version: crypto.randomUUID(), order: Math.max(0, ...[...records.values()].map(r => r.kind === 'result' ? r.order : 0)) + 1, session };
    this.put(`result:${result.version}`, result);
    this.pending = session;
    return this.sync(result);
  }
  private async sync(result: ResultRecord) {
    if (!this.authorized() || this.inFlight.has(result.version)) return false;
    this.inFlight.add(result.version); this.status = 'saving';
    try {
      if (!this.authorized()) return false;
      const incoming = { ...result.session, resultVersion: result.version, resultOrder: result.order };
      const effective = await this.save(this.userId, incoming);
      // Never mutate any other account's device state after an auth transition.
      if (!this.authorized()) return false;
      // A losing transaction confirms its effective cloud version, not incoming.
      if (effective) {
        const winner: ResultRecord = { kind: 'result', version: effective.resultVersion!, order: effective.resultOrder!, session: effective };
        if (!this.valid(winner) || effective.id !== result.session.id) return false;
        if (winner.version !== result.version) {
          if (compareResults(effective, incoming) <= 0) return false;
          this.put(`result:${winner.version}`, winner);
          this.put(`ack:${winner.version}`, { kind: 'ack', version: winner.version });
          return true;
        }
        if (winner.order !== result.order) return false;
      }
      this.put(`ack:${result.version}`, { kind: 'ack', version: result.version });
      return true;
    } catch { return false; }
    finally { this.inFlight.delete(result.version); this.restore(); }
  }
  async retry() {
    if (!this.authorized()) return false;
    const records = this.read();
    const pending = [...this.results(records).values()].filter(r => !this.isAcknowledged(r, records)).sort((a,b)=>a.order-b.order).slice(0, RETRY_BATCH);
    let success = true;
    for (const result of pending) { if (!this.authorized()) return false; if (!await this.sync(result)) success = false; }
    this.restore();
    return success && !this.hasPending;
  }
  get hasPending() { const records = this.read(); return [...this.results(records).values()].some(r => !this.isAcknowledged(r, records)); }
  newAttempt() {
    this.restore();
    if (!this.authorized() || this.pending || this.inFlight.size) return false;
    this.id = crypto.randomUUID(); this.timestamp = 0; this.draft = null; this.acknowledged = null; this.status = 'draft'; this.writeDraft(null); return true;
  }
}
