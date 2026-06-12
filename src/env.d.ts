// For the custom plugins in vite.config.ts

declare module '*?inline-worker' {
    const source: string;
    export default source;
}

declare module '*?inline-binary' {
    const data: string;
    export default data;
}
