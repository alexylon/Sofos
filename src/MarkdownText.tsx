import React from "react";
import ReactMarkdown from "react-markdown";
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {dracula} from "react-syntax-highlighter/dist/esm/styles/prism";

const MarkdownText = ({children}: any) => {
    return (
        <ReactMarkdown
            children={children}
            components={{
                code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                        <SyntaxHighlighter
                            {...props}
                            children={String(children).replace(/\n$/, '')}
                            style={dracula}
                            language={match ? match[1] : "javascript"}
                            PreTag="div"
                        />
                    ) : (
                        <code className={className} {...props} style={{fontWeight: 'bold', backgroundColor: '#D1D1D1', padding: '2px', borderRadius: '3px'}}>
                            {children}
                        </code>
                    )
                }
            }}
        />
    );
};

export default MarkdownText;
