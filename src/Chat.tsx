import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Button, Grid, TextField } from '@mui/material';
import { Configuration, OpenAIApi } from "openai";
import axios from "axios";


const configuration = new Configuration({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

export default function Chat() {
    const [botResponse, setBotResponse] = useState<any>("");
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState("");

    const onSubmit = () => {
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
                setBotResponse(completion?.data?.choices[0]?.message?.content);
                setLoading(false);
            })
            .catch(function (e) {
                setError(true);
                setErrorMessage(e.message);
                setLoading(false);
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
                {loading ? (
                    <div>Loading...</div>
                ) : error ? (
                    <div>Error: {errorMessage}</div>
                ) : (
                    <div>
                        {botResponse ? (
                            <p>{botResponse}</p>
                        ) : (
                            <div>Loading...</div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <Box sx={{flexGrow: 1, p: 10, backgroundColor: '#fafafa'}}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Box sx={{border: '1px solid #ddd', borderRadius: '4px', p: 2}}>
                        <TextField
                            fullWidth
                            id="user-input"
                            label="Input"
                            multiline
                            rows={4}
                            value={input}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                setInput(event.target.value);
                            }}
                            variant="outlined"
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={2}>
                    <Button variant="contained" color="primary" onClick={onSubmit} fullWidth>
                        Send
                    </Button>
                </Grid>
                <Grid item xs={12}>
                    <Box sx={{border: '1px solid #ddd', borderRadius: '4px', p: 2, minHeight: '100px'}}>
                        {completion()}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}