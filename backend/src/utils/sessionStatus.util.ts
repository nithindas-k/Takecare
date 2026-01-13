export const SESSION_STATUS = {
    ACTIVE: 'ACTIVE',
    WAITING_FOR_DOCTOR: 'WAITING_FOR_DOCTOR',
    CONTINUED_BY_DOCTOR: 'CONTINUED_BY_DOCTOR',
    ENDED: 'ENDED',
    TEST_NEEDED: 'TEST_NEEDED',
} as const;

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];

export const isValidSessionStatus = (status: string): status is SessionStatus => {
    return Object.values(SESSION_STATUS).includes(status as SessionStatus);
};

export const isSessionActive = (status: SessionStatus): boolean => {
    return status === SESSION_STATUS.ACTIVE ||
        status === SESSION_STATUS.CONTINUED_BY_DOCTOR ||
        status === SESSION_STATUS.TEST_NEEDED;
};

export const canExtendSession = (status: SessionStatus): boolean => {
    return status === SESSION_STATUS.WAITING_FOR_DOCTOR;
};

export const isSessionLocked = (status: SessionStatus): boolean => {
    return status === SESSION_STATUS.ENDED;
};
