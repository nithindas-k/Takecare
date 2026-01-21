import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UserProfile {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    phone?: string;
    role: 'patient' | 'doctor' | 'admin';
    profileImage?: string;
    specialty?: string;
    department?: string;
    experience?: number;
    consultationFee?: number;
    bio?: string;
    customId?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        zipCode?: string;
    };
    isVerified?: boolean;
    createdAt?: string;
    updatedAt?: string;
    doctorProfileId?: string;

}

interface UserState {
    currentUser: UserProfile | null;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    currentUser: null,
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<UserProfile>) => {
            state.currentUser = action.payload;
            state.loading = false;
            state.error = null;
        },
        updateUser: (state, action: PayloadAction<Partial<UserProfile>>) => {
            if (state.currentUser) {
                state.currentUser = {
                    ...state.currentUser,
                    ...action.payload,
                };
            }
        },
        logout: (state) => {
            state.currentUser = null;
            state.loading = false;
            state.error = null;
        },
        clearUser: (state) => {
            state.currentUser = null;
            state.loading = false;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});

export const { setUser, updateUser, logout, clearError } = userSlice.actions;

export const selectCurrentUser = (state: { user: UserState }) =>
    state.user.currentUser;
export const selectIsLoading = (state: { user: UserState }) => state.user.loading;
export const selectError = (state: { user: UserState }) => state.user.error;

export default userSlice.reducer;
