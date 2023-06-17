import { configureStore } from '@reduxjs/toolkit';
import chatGptReducer from "../features/chat/chatGptSlice";
import { createWrapper } from "next-redux-wrapper";

export const store = configureStore({
    reducer: {
        chatGpt: chatGptReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

// assigning store to next wrapper
const makeStore = () => store;

export const wrapper = createWrapper(makeStore);
