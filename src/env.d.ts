/*!
 * Copyright (c) 2026-present, Vanilagy and contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// For the custom plugins in vite.config.ts

declare module '*?inline-worker' {
    const source: string;
    export default source;
}

declare module '*?inline-binary' {
    const data: string;
    export default data;
}
