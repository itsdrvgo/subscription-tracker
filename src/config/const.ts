export const MESSAGES = {
    ERRORS: {
        AUTH: {
            INVALID_CREDENTIALS: "Invalid credentials",
        },
        GENERAL: {
            GENERIC: "An error occurred, please try again",
            UNAUTHORIZED: "You are not authorized to perform this action",
            FORBIDDEN: "You do not have permission to access this resource",
            NOT_FOUND: "The requested resource was not found",
            CONFLICT: "The resource already exists",
            BAD_REQUEST: "The request is invalid",
            INTERNAL_SERVER_ERROR: "An internal server error occurred",
            INVALID_IDS: (ids: string[]) =>
                `Invalid IDs: ${ids.map((id) => `'${id}'`).join(", ")}`,
        },
    },
} as const;

export const DEFAULT_PFP_URL =
    "https://utfs.io/f/tgjx8p7aDhPeNbVvZa4UDsSHEIjC7GZY9ABuaeVPkrbivNMF" as const;

export const DEFAULT_PAGINATION = {
    GENERAL: {
        LIMIT: 10,
        PAGE: 1,
    },
} as const;

export const COOKIES = {
    ADMIN: "admin_subtrack_drvgo__419615",
} as const;
