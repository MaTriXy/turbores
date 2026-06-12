import { ALL_FORMATS, EncodedPacketSink, FilePathSource, Input } from 'mediabunny';
import { mkdir, writeFile } from 'node:fs/promises';

const extractPacket = async (filePath: string, timestamp: number, outputName: string) => {
    const input = new Input({
        source: new FilePathSource(new URL(`../${filePath}`, import.meta.url).pathname),
        formats: ALL_FORMATS,
    });

    const videoTrack = (await input.getPrimaryVideoTrack())!;
    const sink = new EncodedPacketSink(videoTrack);
    const packet = (await sink.getPacket(timestamp))!;

    const outputPath = new URL(`../tests/public/${outputName}.prores`, import.meta.url);
    await writeFile(outputPath, packet.data);

    console.log(`${outputName}.prores: ${packet.data.byteLength} bytes (t=${packet.timestamp})`);
};

await mkdir(new URL('../tests/public', import.meta.url), { recursive: true });

await extractPacket('prores-buck-bunny.mov', 5, 'buck-bunny');
await extractPacket('prores-buck-bunny-1904.mov', 5, 'buck-bunny-1904');
await extractPacket('prores-buck-bunny-444.mov', 5, 'buck-bunny-444');
await extractPacket('prores-transparent-2.mov', 0, 'transparent-2');
