const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let code = index;
  for (let bit = 0; bit < 8; bit++) code = (code >>> 1) ^ (code & 1 ? 0xedb88320 : 0);
  return code;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
  return (crc ^ 0xffffffff) >>> 0;
}

// Store PNGs directly, since the image bytes are already compressed.
export async function createMugMockupZip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const entries: BlobPart[] = [];
  const directory: ArrayBuffer[] = [];
  let offset = 0;
  let centralSize = 0;

  for (const file of files) {
    const name = new TextEncoder().encode(file.name);
    const checksum = crc32(new Uint8Array(await file.blob.arrayBuffer()));
    const local = new DataView(new ArrayBuffer(30 + name.length));
    const central = new DataView(new ArrayBuffer(46 + name.length));
    const size = file.blob.size;

    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(12, 0x21, true);
    local.setUint32(14, checksum, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, name.length, true);
    new Uint8Array(local.buffer, 30).set(name);

    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    new Uint8Array(central.buffer, 6, 26).set(new Uint8Array(local.buffer, 4, 26));
    central.setUint32(42, offset, true);
    new Uint8Array(central.buffer, 46).set(name);

    entries.push(local.buffer, file.blob);
    directory.push(central.buffer);
    offset += local.byteLength + size;
    centralSize += central.byteLength;
  }

  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...entries, ...directory, end.buffer], { type: 'application/zip' });
}
