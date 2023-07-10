import React from "react";
import ReactMarkdown from "react-markdown";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {dracula} from "react-syntax-highlighter/dist/esm/styles/prism";
import Box from "@mui/material/Box";

const MarkdownText = ({children}: any) => {
    return (
        <ReactMarkdown
            components={{
                code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                        <Box sx={{mt: "-5px", mb: "-5px"}}>
                            <SyntaxHighlighter
                                {...props}
                                style={dracula}
                                language={match ? match[1] : "javascript"}
                                PreTag="div"
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        </Box>
                    ) : (
                        <code
                            className={className}
                            {...props}
                            style={{
                                fontWeight: 'bold',
                                backgroundColor: '#c5c5c5',
                                padding: '2px',
                                borderRadius: '3px'
                            }}
                        >
                            {children}
                        </code>
                    );
                },
            }}
        >
            {children}
        </ReactMarkdown>
    );
};

export default MarkdownText;
