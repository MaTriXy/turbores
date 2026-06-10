export class OutOfMemoryError extends Error {
    constructor(message = 'The decoder ran out of memory.') {
        super(message);
        this.name = 'OutOfMemoryError';
    }
}

export class UnexpectedEofError extends Error {
    constructor(message = 'The packet ended before the decoder expected it to.') {
        super(message);
        this.name = 'UnexpectedEofError';
    }
}

export class InvalidDataError extends Error {
    constructor(message = 'The packet contains invalid data.') {
        super(message);
        this.name = 'InvalidDataError';
    }
}

export class NotSupportedError extends Error {
    constructor(message = 'The packet uses a feature that is not supported.') {
        super(message);
        this.name = 'NotSupportedError';
    }
}

export class InvalidStateError extends Error {
    constructor(message = 'The decoder is in an invalid state.') {
        super(message);
        this.name = 'InvalidStateError';
    }
}

export const createErrorFromCodeAndMessage = (code: number, message?: string) => {
    switch (code) {
        case -1: return new OutOfMemoryError(message);
        case -2: return new UnexpectedEofError(message);
        case -3: return new InvalidDataError(message);
        case -4: return new NotSupportedError(message);
        case -5: return new InvalidStateError(message);
        // Overflow is just another flavor of invalid data
        case -6: return new InvalidDataError(message ?? 'Unexpected integer overflow.');
        default: throw new Error(`Unhandled error code: ${code}`);
    }
};
