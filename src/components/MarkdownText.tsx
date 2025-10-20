import React, { memo, useMemo, useCallback } from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AppBar, Box, Toolbar, useTheme } from "@mui/material";
import { CopyToClipboardButton } from "@/components/CopyToClipboardButton";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css"; // `rehype-katex` does not import the CSS for you

const MemoizedMarkdown = memo(Markdown);

const MarkdownText = ({ children }: any) => {
	const remarkPlugins = useMemo(() => [remarkMath], []);
	const rehypePlugins = useMemo(() => [rehypeKatex], []);
	const theme = useTheme();

	const CodeBlock = useCallback(
		function CodeBlock({ node, className, children, ...rest }: any) {
			const match = /language-(\w+)/.exec(className || "");
			return match ? (
				<Box>
					<Box sx={{ flexGrow: 1 }}>
						<AppBar
							position="static"
							color="primary"
							sx={{
								backgroundColor: "#777777",
								borderRadius: "13px 13px 0 0",
								zIndex: "modal",
								mb: "-10px",
							}}
							elevation={0}
						>
							<Toolbar variant="dense">
								<Box sx={{ display: "flex" }}>{(match && match[1]) || ""}</Box>
								<Box sx={{ flexGrow: 10 }} />
								<Box sx={{ display: "flex", mr: -1 }}>
									<CopyToClipboardButton
										value={String(children).replace(/\n$/, "")}
										color={theme.palette.text.primary}
									/>
								</Box>
							</Toolbar>
						</AppBar>
					</Box>
					<SyntaxHighlighter
						style={vscDarkPlus}
						customStyle={{ borderRadius: "0 0 13px 13px" }}
						language={match[1]}
						PreTag="div"
						showLineNumbers={false}
						codeTagProps={{
							style: {
								fontSize: "0.9rem",
								fontFamily: "var(--font-mono)",
							},
						}}
					>
						{String(children).replace(/\n$/, "")}
					</SyntaxHighlighter>
				</Box>
			) : (
				<code
					className={className}
					{...rest}
					style={{
						fontWeight: "bold",
					}}
				>
					{children}
				</code>
			);
		},
		[]
	);

	const components = useMemo(
		() => ({
			code: CodeBlock,
		}),
		[CodeBlock]
	);

	return (
		<MemoizedMarkdown
			remarkPlugins={remarkPlugins}
			rehypePlugins={rehypePlugins}
			components={components}
		>
			{children}
		</MemoizedMarkdown>
	);
};

export default MarkdownText;
