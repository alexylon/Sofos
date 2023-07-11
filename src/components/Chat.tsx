'use client'

import React, {useState} from 'react';
import Box from '@mui/material/Box';
import {Button, Grid, TextField} from '@mui/material';
import Completion from "@/components/Completion";
import TemperatureSlider from "@/components/TemperatureSlider";
import {TextareaAutosize} from "@mui/base";
import {useChat} from 'ai/react'


export default function Chat() {
    const {input, isLoading, handleInputChange, handleSubmit, messages, reload, stop} = useChat();
    // const [temperatureValue, setTemperatureValue] = useState<number | number[]>(
    //     0.7,
    // );

    // const handleTemperatureInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     setTemperatureValue(event.target.value === '' ? 0 : Number(event.target.value));
    // };

    return (
        <Box sx={{
            height: '96vh',
            maxWidth: 700,
            marginLeft: "auto",
            marginRight: "auto",
            backgroundColor: '#F0F0F0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            py: 1,
        }}>
            {/*<Grid item xs={12} sx={{mt: "15px"}}>*/}
            {/*    <TemperatureSlider*/}
            {/*        handleTemperatureInputChange={handleTemperatureInputChange}*/}
            {/*        setTemperatureValue={setTemperatureValue}*/}
            {/*        temperatureValue={temperatureValue}*/}
            {/*    />*/}
            {/*</Grid>*/}
            <Grid container spacing={2}>
                <Grid item xs={12} className="messageContainer">
                    <Box sx={{
                        border: '2px solid #ddd',
                        borderRadius: '5px',
                        p: 1,
                        maxHeight: 'calc(90vh - 100px)', // Here, adjust the 100px value based on the height of sendMessageContainer and any desired margins
                        overflowY: 'auto',
                        flex: 1, // This will allow it to expand and shrink
                        mb: 0, // Adding margin at the bottom
                    }}>
                        <Completion messages={messages} reload={reload}/>
                    </Box>
                </Grid>
            </Grid>
            <Grid container spacing={2} className="sendMessageContainer">
                <Grid item xs={12}>
                    <Box sx={{border: '2px solid #ddd', borderRadius: '5px', p: 1}}>
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
                                    style: {resize: 'none'},
                                },
                            }}
                            value={input}
                            onChange={handleInputChange}
                            variant="outlined"
                            disabled={false}
                            sx={{borderRadius: '5px', backgroundColor: '#FAFAFA'}}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit as () => void}
                        fullWidth
                        disabled={false}
                    >
                        Send
                    </Button>
                </Grid>
                <Grid item xs={12} md={6} style={{display: "flex", justifyContent: "flex-end"}}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={stop as () => void}
                        disabled={!isLoading}
                    >
                        Abort
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}
