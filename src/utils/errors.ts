export class AppError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(message, 401);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string) {
        super(message, 500);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string) {
        super(message, 403);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class PaymentError extends AppError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class PaymentRequiredError extends AppError {
    constructor(message: string) {
        super(message, 402);
    }
}

export class GatewayTimeoutError extends AppError {
    constructor(message: string) {
        super(message, 504);
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(message: string) {
        super(message, 503);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message: string) {
        super(message, 429);
    }
}

export class PayloadTooLargeError extends AppError {
    constructor(message: string) {
        super(message, 413);
    }
}

export class UnsupportedMediaTypeError extends AppError {
    constructor(message: string) {
        super(message, 415);
    }
}

export class NotAcceptableError extends AppError {
    constructor(message: string) {
        super(message, 406);
    }
}

export class RequestTimeoutError extends AppError {
    constructor(message: string) {
        super(message, 408);
    }
}

export class NothingChangedError extends AppError {
    constructor(message: string) {
        super(message, 405);
    }
}