import { configureStore } from '@reduxjs/toolkit';
import chatGptReducer from "../features/chat/chatGptSlice";

export const store = configureStore({
    reducer: {
        chatGpt: chatGptReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
