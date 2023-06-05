import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Button, Grid, TextField } from '@mui/material';
import { Configuration, OpenAIApi } from "openai";
import axios from "axios";
import { useAppSelector, useAppDispatch } from './app/hooks';
import { addChatRound, ChatRound, setChatStatus } from "./features/chat/chatGptSlice";


const configuration = new Configuration({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

export default function Chat() {
    const status = useAppSelector(state => state.chatGpt.chatStatus);
    const chatRounds = useAppSelector(state => state.chatGpt.messages);
    const dispatch = useAppDispatch();
    const [input, setInput] = useState("");

    const onSubmit = () => {
        dispatch(setChatStatus('loading'));

        async function getCompletion() {
            const openai = new OpenAIApi(configuration);
            return await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [{"role": "user", "content": input}],
                temperature: 0.2
            });
        }

        getCompletion()
            .then(completion => {
                dispatch(setChatStatus('idle'));
                dispatch(addChatRound({
                    userMessage: input,
                    botResponse: completion?.data?.choices[0]?.message?.content,
                    error: "",
                }))
                setInput("");
            })
            .catch(function (e) {
                dispatch(setChatStatus('failed'));
                dispatch(addChatRound({
                    userMessage: input,
                    botResponse: "",
                    error: e.message,
                }))
                setInput("");
                if (axios.isCancel(e)) {
                    console.log(`request cancelled:${e.message}`);
                } else {
                    console.log("another error happened:" + e.message);
                }
            });
    }

    const completion = () => {
        return (
            <div style={{minHeight: "auto", height: "auto"}}>
                <div>
                    {chatRounds && (chatRounds.map((chatRound: ChatRound) => {
                            return (
                                <>
                                    <Grid item xs={12}>
                                        <Box sx={{
                                            border: '2px solid #ddd',
                                            borderRadius: '4px',
                                            p: 2,
                                            minHeight: '20px',
                                            backgroundColor: '#e0e0e0'
                                        }}>
                                            {chatRound.userMessage}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{
                                            border: '2px solid #ddd',
                                            borderRadius: '4px',
                                            p: 2,
                                            minHeight: '20px',
                                            backgroundColor: status !== 'failed' ? 'lightblue' : '#FF7276'
                                        }}>
                                            {status !== 'failed'
                                                ? chatRound.botResponse
                                                :
                                                chatRound.error}
                                        </Box>
                                    </Grid>
                                    <br/>
                                </>
                            )
                        })
                    )}
                </div>
            </div>
        )
    }

    return (
        <Box sx={{flexGrow: 1, p: 10, paddingLeft: 35, paddingRight: 35, backgroundColor: '#fafafa'}}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Box sx={{border: '2px solid #ddd', borderRadius: '4px', p: 2, minHeight: '20px'}}>
                        {completion()}
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Box sx={{p: 1}}>
                        {status === 'loading' && (<p>Generating response...</p>)}
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Box sx={{border: '2px solid #ddd', borderRadius: '4px', p: 2}}>
                        <TextField
                            fullWidth
                            id="user-input"
                            label="Send a message..."
                            multiline
                            rows={4}
                            value={input}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                setInput(event.target.value);
                            }}
                            variant="outlined"
                            disabled={status === 'loading'}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={2}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onSubmit}
                        fullWidth
                        disabled={status === 'loading'}
                    >
                        Send
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
