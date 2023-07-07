import React, {useState} from 'react';
import Box from '@mui/material/Box';
import {Button, Grid, TextField} from '@mui/material';
import axios from "axios";
import {useAppSelector, useAppDispatch} from '@/store/hooks';
import {addChatRound, setChatStatus} from "@/features/chat/chatGptSlice";
import getCompletion from "@/pages/api/getData";
import AutoScrollingWindow from "@/components/AutoScrollingWindow";
import Completion from "@/components/Completion";
import TemperatureSlider from "@/components/TemperatureSlider";
import {TextareaAutosize} from "@mui/base";


export default function Chat() {
    const status = useAppSelector(state => state.chatGpt.chatStatus);
    const chatRoundsCount = useAppSelector(state => state.chatGpt.chatRoundsCount);
    const dispatch = useAppDispatch();
    const [input, setInput] = useState("");
    const [temperatureValue, setTemperatureValue] = useState<number | number[]>(
        0.7,
    );

    const onSubmit = () => {
        dispatch(setChatStatus('loading'));

        getCompletion(input, temperatureValue)
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

    const handleTemperatureInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTemperatureValue(event.target.value === '' ? 0 : Number(event.target.value));
    };

    return (
        <AutoScrollingWindow chatRoundsCount={chatRoundsCount}>
            <Box sx={{
                flexGrow: 1,
                p: 3,
                maxWidth: 800,
                marginLeft: "auto",
                marginRight: "auto",
                backgroundColor: '#F0F0F0'
            }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TemperatureSlider
                            handleTemperatureInputChange={handleTemperatureInputChange}
                            setTemperatureValue={setTemperatureValue}
                            temperatureValue={temperatureValue}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{border: '2px solid #ddd', borderRadius: '5px', p: 2, minHeight: '20px'}}>
                            <Completion/>
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{p: 1}}>
                            {status === 'loading' && (<p>Generating response...</p>)}
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{border: '2px solid #ddd', borderRadius: '5px', p: 2}}>
                            <TextField
                                fullWidth
                                id="user-input"
                                label="Send a message..."
                                multiline
                                InputProps={{
                                    inputComponent: TextareaAutosize,
                                    inputProps: {
                                        minRows: 1,
                                        maxRows: 10,
                                        style: { resize: 'none' },
                                    },
                                }}
                                value={input}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    setInput(event.target.value);
                                }}
                                variant="outlined"
                                disabled={status === 'loading'}
                                sx={{borderRadius: '5px', backgroundColor: '#FAFAFA'}}
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
        </AutoScrollingWindow>
    );
}
