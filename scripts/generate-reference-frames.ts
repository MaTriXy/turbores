import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { Decoder, Frame } from '../src/index';

const decoder = await Decoder.create({ useSharedMemory: true, concurrency: 0 });
if (decoder instanceof Error) {
    throw decoder;
}

for (const name of ['buck-bunny', 'buck-bunny-1904', 'buck-bunny-444', 'transparent-2']) {
    const packet = await readFile(new URL(`../tests/public/${name}.prores`, import.meta.url));

    const frame = new Frame();
    const result = await decoder.decode(new Uint8Array(packet), frame);
    if (result instanceof Error) {
        throw result;
    }

    // Gzip because they big
    await writeFile(new URL(`../tests/public/${name}.framedata.gz`, import.meta.url), gzipSync(result.frameData));
    console.log(`${name}: ${result.frameData.byteLength} bytes of frame data`);

    frame.clear();
}

await decoder.close();
