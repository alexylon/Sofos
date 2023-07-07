import React from "react";
import {ChatRound} from "@/features/chat/chatGptSlice";
import {Grid} from "@mui/material";
import Box from "@mui/material/Box";
import MarkdownText from "@/components/MarkdownText";
import {useAppSelector} from "@/store/hooks";


export default function Completion() {
    const status = useAppSelector(state => state.chatGpt.chatStatus);
    const chatRounds = useAppSelector(state => state.chatGpt.messages);

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