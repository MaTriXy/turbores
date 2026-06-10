import { initWasmModule, type WasmExports } from './wasm';

export type Runtime = {
    memory: WebAssembly.Memory;
    exports: WasmExports;
    workers: Worker[];
}

let runtimePromise: Promise<Runtime> | null = null;

export const getRuntime = () => {
    return runtimePromise ??= initRuntime();
};

const initRuntime = async (): Promise<Runtime> => {
    const memory = new WebAssembly.Memory({ initial: 32, maximum: 65536, shared: true });
    const exports = await initWasmModule(memory);

    const mainThreadTls = exports.allocateThreadLocalState(exports.__tls_size.value, exports.__tls_align.value);
    if (mainThreadTls === 0) {
        throw new Error('Failed to allocate thread-local state.');
    }
    exports.__wasm_init_tls(mainThreadTls);

    const isBrowserMainThread =
        typeof window !== "undefined" &&
        typeof document !== "undefined" &&
        self === window;
    exports.setIsBrowserMainThread(Number(isBrowserMainThread));

    const concurrency = navigator.hardwareConcurrency;
    const workers: Worker[] = [];
    const ready: Promise<void>[] = [];

    for (let i = 0; i < concurrency; i++) {
        const stackPointer = exports.allocateWorkerStack();
        const tlsPointer = exports.allocateThreadLocalState(exports.__tls_size.value, exports.__tls_align.value);
        if (stackPointer === 0 || tlsPointer === 0) {
            throw new Error('Failed to allocate worker stack or thread-local state.');
        }

        const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
        worker.postMessage({ memory, stackPointer, tlsPointer });

        workers.push(worker);
        ready.push(new Promise(resolve => worker.addEventListener('message', () => resolve(), { once: true })));
    }

    await Promise.all(ready);

    return { memory, exports, workers };
};
