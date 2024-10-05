import React, { FC, memo } from "react";
import ReactMarkdown, { Options } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AppBar, Box, Toolbar } from "@mui/material";
import { CopyToClipboardButton } from "@/components/CopyToClipboardButton";

const MemoizedReactMarkdown: FC<Options> = memo(
	ReactMarkdown,
	(prevProps, nextProps) =>
		prevProps.children === nextProps.children &&
		prevProps.className === nextProps.className
)

const MarkdownText = ({children}: any) => {
	return (
		<MemoizedReactMarkdown
			components={{
				code({node, inline, className, children, ...props}) {
					const match = /language-(\w+)/.exec(className || '');
					return !inline
						? (
							<Box>
								<Box sx={{flexGrow: 1}}>
									<AppBar
										position="static"
										color="primary"
										sx={{
											backgroundColor: '#777777',
											borderRadius: '12px 12px 0 0',
											zIndex: 'modal',
											mb: '-10px'
										}}
										elevation={0}
									>
										<Toolbar variant="dense">
											<Box sx={{display: 'flex'}}>
												{(match && match[1]) || ''}
											</Box>
											<Box sx={{flexGrow: 10}} />
											<Box sx={{display: 'flex', mr: -1}}>
												<CopyToClipboardButton
													value={String(children).replace(/\n$/, '')}
													color="white"
												/>
											</Box>
										</Toolbar>
									</AppBar>
								</Box>
								<SyntaxHighlighter
									{...props}
									style={dracula}
									customStyle={{borderRadius: '0 0 12px 12px'}}
									language={(match && match[1]) || ''}
									PreTag="div"
									showLineNumbers={false}
									codeTagProps={{
										style: {
											fontSize: '0.9rem',
											fontFamily: 'var(--font-mono)'
										}
									}}
								>
									{String(children).replace(/\n$/, '')}
								</SyntaxHighlighter>
							</Box>
						)
						: (
							<code
								className={className}
								{...props}
								style={{
									fontWeight: 'bold',
								}}
							>
								{children}
							</code>
						);
				},
			}}
		>
			{children}
		</MemoizedReactMarkdown>
	);
};

export default MarkdownText;
