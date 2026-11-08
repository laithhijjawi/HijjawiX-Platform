/**
 * Hijjawi X EV Diagnostic - read-only CAN data utilities.
 * Profile schema: hxed-can-v1. No vehicle-specific PID assumptions.
 */
const FD_LENGTHS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 20, 24, 32, 48, 64];
const SIGNAL_KEYS = new Set(['cell', 'soc', 'packVoltage', 'packCurrent', 'temperature']);
export const SPEEDS = Object.freeze({125000:'S4',250000:'S5',500000:'S6',1000000:'S8'});

export function parseSlcanLine(input, receivedAt = Date.now()) {
  if (typeof input !== 'string') return null;
  const line = input.trim();
  const type = line[0];
  if (!'tTrRdDbB'.includes(type || '?')) return null;
  const extended = type === type.toUpperCase();
  const remote = type === 'r' || type === 'R';
  const fd = 'dDbB'.includes(type);
  const brs = type === 'b' || type === 'B';
  const idSize = extended ? 8 : 3;
  if (line.length < 2 + idSize) return null;
  const idText = line.slice(1, 1 + idSize);
  const dlcText = line[1 + idSize];
  if (!/^[0-9a-f]+$/i.test(idText) || !/^[0-9a-f]$/i.test(dlcText)) return null;
  const id = parseInt(idText, 16);
  if (id > (extended ? 0x1FFFFFFF : 0x7FF)) return null;
  const dlcCode = parseInt(dlcText, 16);
  if (!fd && dlcCode > 8) return null;
  const dlc = fd ? FD_LENGTHS[dlcCode] : dlcCode;
  const expectedChars = remote ? 0 : dlc * 2;
  const payload = line.slice(2 + idSize);
  if (payload.length < expectedChars) return null;
  const hex = payload.slice(0, expectedChars);
  const timestamp = payload.slice(expectedChars);
  if (!/^[0-9a-f]*$/i.test(hex) || !(/^[0-9a-f]{0,4}$/i.test(timestamp))) return null;
  const data = [];
  for (let i = 0; i < hex.length; i += 2) data.push(parseInt(hex.slice(i, i + 2), 16));
  return {id, idHex:id.toString(16).toUpperCase().padStart(idSize, '0'),
    extended, remote, fd, brs, dlc, data, receivedAt};
}

function integer(value, lower, upper, label) {
  if (!Number.isSafeInteger(value) || value < lower || value > upper) throw new Error('Invalid ' + label);
  return value;
}
function finite(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1e9) throw new Error('Invalid ' + label);
  return value;
}
function parseId(value) {
  let id;
  if (typeof value === 'string' && /^0x[0-9a-f]{1,8}$/i.test(value)) id = Number.parseInt(value.slice(2), 16);
  else if (Number.isSafeInteger(value)) id = value;
  else throw new Error('Invalid CAN frame ID');
  return integer(id, 0, 0x1FFFFFFF, 'CAN ID');
}
export function validateProfile(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile) || profile.schema !== 'hxed-can-v1') throw new Error('Invalid profile schema');
  const name = String(profile.name || '').trim();
  if (!name || name.length > 80) throw new Error('Invalid profile name');
  const expectedCells = integer(profile.expectedCells || 0, 0, 512, 'expectedCells');
  if (!Array.isArray(profile.frames) || profile.frames.length < 1 || profile.frames.length > 256) throw new Error('Invalid frames');
  let count = 0;
  const frames = profile.frames.map(item => {
    const id = parseId(item.id);
    const extended = item.extended === undefined ? id > 0x7FF : Boolean(item.extended);
    if ((!extended && id > 0x7FF) || !Array.isArray(item.signals) || !item.signals.length || item.signals.length > 64) throw new Error('Invalid signal definition');
    const signals = item.signals.map(sig => {
      if (!SIGNAL_KEYS.has(sig.key)) throw new Error('Unsupported signal key');
      const startByte = integer(sig.startByte, 0, 63, 'startByte');
      const length = integer(sig.length, 1, 4, 'length');
      if (startByte + length > 64) throw new Error('Signal exceeds frame');
      const factor = finite(sig.factor === undefined ? 1 : sig.factor, 'factor');
      const offset = finite(sig.offset === undefined ? 0 : sig.offset, 'offset');
      const endian = sig.endian || 'little';
      if (!['little','big'].includes(endian)) throw new Error('Invalid endian');
      const signed = Boolean(sig.signed);
      const cell = sig.key === 'cell' ? integer(sig.cell, 1, 512, 'cell') : undefined;
      const module = sig.key === 'cell' && sig.module !== undefined ? integer(sig.module, 1, 64, 'module') : undefined;
      return {key:sig.key,startByte,length,factor,offset,endian,signed,cell,module};
    });
    count += signals.length;
    return {id,extended,signals};
  });
  if (count > 2048) throw new Error('Too many signals');
  return {schema:'hxed-can-v1',name,expectedCells,frames};
}
export function decodeFrame(frame, profile) {
  if (!profile || frame.remote) return [];
  const out = [];
  for (const spec of profile.frames) {
    if (spec.id !== frame.id || spec.extended !== frame.extended) continue;
    for (const signal of spec.signals) {
      if (signal.startByte + signal.length > frame.data.length) continue;
      let raw = 0;
      const bytes = frame.data.slice(signal.startByte, signal.startByte + signal.length);
      if (signal.endian === 'little') {
        for (let j = bytes.length - 1; j >= 0; j--) raw = raw * 256 + bytes[j];
      } else {
        for (const byte of bytes) raw = raw * 256 + byte;
      }
      const bits = signal.length * 8;
      if (signal.signed && raw >= 2 ** (bits - 1)) raw -= 2 ** bits;
      const value = raw * signal.factor + signal.offset;
      if (Number.isFinite(value)) out.push({key:signal.key,cell:signal.cell,module:signal.module,value});
    }
  }
  return out;
}
export function csvText(rows) {
  return rows.map(row => row.map(value => {
    let s = value === undefined || value === null ? '' : String(value);
    if (/^[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replace(/"/g,'""') + '"';
  }).join(',')).join('\r\n') + '\r\n';
}
