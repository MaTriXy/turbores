import { createErrorFromCodeAndMessage, OutOfMemoryError } from './errors';
import { decodeUtf8 } from './misc';
import { getRuntime, type Runtime } from './runtime';

export type PixelFormat = `I${'422' | '444'}${'' | 'A'}P${'10' | '12'}`;

export type DecodeResult = {
    frameData: Uint8Array;
    codedWidth: number;
    codedHeight: number;
    displayWidth: number;
    displayHeight: number;
    pixelFormat: PixelFormat;
    colorPrimaries: number;
    colorTransfer: number;
    colorMatrix: number;
    colorRangeFull: boolean;
}

export class Decoder {
    private runtime: Runtime;
    private ptr: number;
    private waitWordAddress: number;

    // All decode and close calls run through this chain, so they never overlap and close waits for in-flight decodes
    private queue: Promise<unknown> = Promise.resolve();

    constructor(runtime: Runtime, ptr: number) {
        this.runtime = runtime;
        this.ptr = ptr;
        this.waitWordAddress = runtime.exports.getWaitWordAddress(ptr);
    }

    decode(packetData: Uint8Array) {
        return this.queue.then(() => this.runDecode(packetData));
    }

    close() {
        return this.queue.then(() => {
            this.runtime.exports.closeDecoder(this.ptr);
        });
    }

    private async runDecode(packetData: Uint8Array) {
        const { exports, memory } = this.runtime;

        const packetPtr = exports.allocatePacket(this.ptr, packetData.byteLength);
        if (packetPtr === 0) {
            return new OutOfMemoryError();
        }
        new Uint8Array(memory.buffer).set(packetData, packetPtr);

        let resultCode = exports.decodePacket(this.ptr);
        if (resultCode < 0) {
            return this.createError(resultCode);
        }

        await Atomics.waitAsync(new Int32Array(memory.buffer), this.waitWordAddress / 4, 0).value;

        resultCode = exports.finalizePacketDecoding(this.ptr);
        if (resultCode < 0) {
            return this.createError(resultCode);
        }

        const codedWidth = exports.getCodedWidth(this.ptr);
        const codedHeight = exports.getCodedHeight(this.ptr);
        const displayWidth = exports.getDisplayWidth(this.ptr);
        const displayHeight = exports.getDisplayHeight(this.ptr);

        const frameDataPtr = exports.getFrameDataPtr(this.ptr);
        const frameDataSize = exports.getFrameDataSize(this.ptr);
        const frameData = new Uint8Array(memory.buffer, frameDataPtr, frameDataSize * 2);

        const chroma = exports.getChromaSubsampling(this.ptr);
        const alpha = exports.getAlphaBitDepth(this.ptr) !== 0 ? 'A' : '';
        const bitDepth = exports.getBitDepth(this.ptr);
        const pixelFormat = `I${chroma}${alpha}P${bitDepth}` as PixelFormat;

        const result: DecodeResult = {
            frameData,
            codedWidth,
            codedHeight,
            displayWidth,
            displayHeight,
            pixelFormat,
            colorPrimaries: exports.getColorPrimaries(this.ptr),
            colorTransfer: exports.getColorTransfer(this.ptr),
            colorMatrix: exports.getColorMatrix(this.ptr),
            colorRangeFull: false, // Always limited range, but expose it for clarity
        };

        return result;
    }

    private createError(code: number) {
        const { exports, memory } = this.runtime;

        let errorMessage: string | undefined = undefined;

        const messagePtr = exports.getErrorMessagePtr(this.ptr);
        if (messagePtr !== 0) {
            const size = exports.getErrorMessageSize(this.ptr);
            errorMessage = decodeUtf8(new Uint8Array(memory.buffer, messagePtr, size));
        }

        return createErrorFromCodeAndMessage(code, errorMessage);
    }
}

export type DecoderOptions = {};

export const createDecoder = async (options: DecoderOptions = {}) => {
    void options;

    const runtime = await getRuntime();

    const decoderPtr = runtime.exports.createDecoder();
    if (decoderPtr === 0) {
        return new OutOfMemoryError();
    }

    return new Decoder(runtime, decoderPtr);
};