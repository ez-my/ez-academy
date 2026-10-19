const recordingFields = new Set(['audio', 'audioUrl', 'audioBlob', 'audioBase64', 'recording', 'recordingUrl', 'recordingData', 'recordingBlob']);

// Results and transcript text may sync; binary recordings and device-only URLs
// must never enter a Firestore session or shared question-bank document.
export function withoutRecordingData(value: any): any {
  if (value instanceof Blob || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return undefined;
  if (typeof value === 'string' && /^(?:data:audio\/|blob:)/i.test(value)) return undefined;
  if (Array.isArray(value)) return value.map(withoutRecordingData).filter(item => item !== undefined);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const clean: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) {
      if (recordingFields.has(key)) continue;
      const sanitized = withoutRecordingData(item);
      if (sanitized !== undefined) clean[key] = sanitized;
    }
    return clean;
  }
  return value;
}
