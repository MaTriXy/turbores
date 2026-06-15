// Usage: npx tsx scripts/extract-test-packets.ts <input-file> <timestamp> <output-name>

import { ALL_FORMATS, EncodedPacketSink, FilePathSource, Input } from 'mediabunny';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [inputFile, timestamp, outputName] = process.argv.slice(2);
if (!inputFile || timestamp === undefined || !outputName) {
    throw new Error('Usage: extract-test-packets.ts <input-file> <timestamp> <output-name>');
}

const input = new Input({
    source: new FilePathSource(resolve(inputFile)),
    formats: ALL_FORMATS,
});

const videoTrack = (await input.getPrimaryVideoTrack())!;
const sink = new EncodedPacketSink(videoTrack);
const packet = (await sink.getPacket(Number(timestamp)))!;

const outputPath = new URL(`../tests/public/${outputName}.prores`, import.meta.url);
await writeFile(outputPath, packet.data);

console.log(`${outputName}.prores: ${packet.data.byteLength} bytes (t=${packet.timestamp})`);
