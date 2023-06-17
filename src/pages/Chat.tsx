import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Button, Grid, Input, Slider, TextField } from '@mui/material';
import axios from "axios";
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addChatRound, ChatRound, setChatStatus } from "@/features/chat/chatGptSlice";
import ThermostatIcon from '@mui/icons-material/Thermostat';
import MarkdownText from "./MarkdownText";
import getCompletion from "@/pages/api/getData";


export default function Chat() {
    console.log("apiKey: ", process.env.OPENAI_API_KEY)
    const status = useAppSelector(state => state.chatGpt.chatStatus);
    const chatRounds = useAppSelector(state => state.chatGpt.messages);
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

    const completion = () => {
        return (
            <div style={{minHeight: "auto", height: "auto"}}>
                <div>
                    {chatRounds && (chatRounds.map((chatRound: ChatRound, index: number) => {
                            return (
                                <div key={index}>
                                    <Grid item xs={12}>
                                        <Box sx={{
                                            borderRadius: '5px',
                                            p: 3,
                                            marginBottom: 1.5,
                                            minHeight: '20px',
                                            backgroundColor: '#a9d3ea'
                                        }}>
                                            {chatRound.userMessage}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Box sx={{
                                            borderRadius: '5px',
                                            p: 3,
                                            marginBottom: -1,
                                            minHeight: '20px',
                                            backgroundColor: status !== 'failed' ? '#d5d5d5' : '#ff8083'
                                        }}>
                                            {status !== 'failed'
                                                ?
                                                <MarkdownText>
                                                    {chatRound.botResponse}
                                                </MarkdownText>
                                                :
                                                chatRound.error}
                                        </Box>
                                    </Grid>
                                    <br/>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        )
    }

    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        setTemperatureValue(newValue);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTemperatureValue(event.target.value === '' ? 0 : Number(event.target.value));
    };

    const handleBlur = () => {
        if (!Array.isArray(temperatureValue)) {
            if (temperatureValue < 0) {
                setTemperatureValue(0);
            } else if (temperatureValue > 2) {
                setTemperatureValue(2);
            }
        }
    }

    const marks = [
        {
            value: 0,
            label: '0',
        },
        {
            value: 2,
            label: '2',
        },
    ];

    const slider = () => {
        return (
            <>
                <Box sx={{width: 350}}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item>
                            <ThermostatIcon/>
                        </Grid>
                        <Grid item xs>
                            <Slider
                                value={temperatureValue}
                                onChange={handleSliderChange}
                                step={0.1}
                                min={0}
                                max={2}
                                marks={marks}
                                aria-labelledby="input-slider"
                            />
                        </Grid>
                        <Grid item>
                            <Box sx={{p: 1, marginTop: -6}}>
                                <Input
                                    value={temperatureValue}
                                    size="small"
                                    onChange={handleInputChange}
                                    onBlur={handleBlur}
                                    inputProps={{
                                        step: 0.1,
                                        min: 0,
                                        max: 2.0,
                                        type: 'number',
                                        'aria-labelledby': 'input-slider',
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </>
        )
    }

    return (
        <Box sx={{
            flexGrow: 1,
            p: 10,
            maxWidth: 800,
            marginLeft: "auto",
            marginRight: "auto",
            backgroundColor: '#F0F0F0'
        }}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    {slider()}
                </Grid>
                <Grid item xs={12}>
                    <Box sx={{border: '2px solid #ddd', borderRadius: '5px', p: 2, minHeight: '20px'}}>
                        {completion()}
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
                            rows={4}
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
    );
}
