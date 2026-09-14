/* OQ1 wire format shared with OfflineQR.exe (src/Protocol.cs). */
(function (root) {
  'use strict';
  const MAX_BYTES = 2 * 1024 * 1024;
  const CHUNK_SIZE = 480;
  async function encode(text) {
    const raw = new TextEncoder().encode(text);
    if (!raw.length) throw new Error('请先输入需要传输的文字。');
    if (raw.length > MAX_BYTES) throw new Error('文字超过 2 MB，请缩短后重新生成。');
    if (!root.crypto || !root.crypto.subtle) throw new Error('请通过 HTTPS、localhost 或本地文件打开本页。');
    const hashBytes = new Uint8Array(await root.crypto.subtle.digest('SHA-256', raw));
    const hash = Array.from(hashBytes, b => b.toString(16).padStart(2, '0')).join('');
    // Raw DEFLATE, not zlib/gzip: matches .NET DeflateStream.
    const packed = root.fflate.deflateSync(raw, { level: 6 });
    const compressed = packed.length < raw.length;
    const bytes = compressed ? packed : raw;
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    }
    const body = btoa(binary);
    const total = Math.ceil(body.length / CHUNK_SIZE);
    const parts = [];
    for (let i = 0; i < total; i++) {
      parts.push(`OQ1|${hash}|${compressed ? 'D' : 'R'}|${i}|${total}|${body.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)}`);
    }
    return { parts, hash, rawBytes: raw.length, packedBytes: bytes.length, compressed };
  }
  root.OQProtocol = Object.freeze({ encode, MAX_BYTES, CHUNK_SIZE });
})(globalThis);
