import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Define interfaces
export interface ChatRound {
    userMessage: string;
    botResponse?: string;
    error?: string;
}

export interface ChatGptState {
    messages: ChatRound[];
    chatStatus: 'idle' | 'loading' | 'failed';
    chatRoundsCount: number;
}

// Initialize state
const initialState: ChatGptState = {
    messages: [],
    chatStatus: 'idle',
    chatRoundsCount: 0,
}

// Create slice
export const chatGptSlice = createSlice({
    name: 'chatGpt',
    initialState,
    reducers: {
        addChatRound: (state: ChatGptState, action: PayloadAction<ChatRound>) => {
            state.messages.push(action.payload);
            state.chatRoundsCount = state.messages.length;
        },
        setChatStatus: (state: ChatGptState, action: PayloadAction<'idle' | 'loading' | 'failed'>) => {
            state.chatStatus = action.payload;
        },
    },
});

export const {addChatRound, setChatStatus} = chatGptSlice.actions;

export default chatGptSlice.reducer;
