import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Define interfaces
export interface ChatRound {
    userMessage: string;
    botResponse?: string;
}

export interface ChatGptState {
    messages: ChatRound[];
    chatStatus: 'idle' | 'loading' | 'failed';
}

// Initialize state
const initialState: ChatGptState = {
    messages: [],
    chatStatus: 'idle',
}

// Create slice
export const chatGptSlice = createSlice({
    name: 'chatGpt',
    initialState,
    reducers: {
        addChatRound: (state: ChatGptState, action: PayloadAction<ChatRound>) => {
            state.messages.push(action.payload);
        },
        setChatStatus: (state: ChatGptState, action: PayloadAction<'idle' | 'loading' | 'failed'>) => {
            state.chatStatus = action.payload;
        },
    },
});

export const {addChatRound, setChatStatus} = chatGptSlice.actions;

export default chatGptSlice.reducer;
