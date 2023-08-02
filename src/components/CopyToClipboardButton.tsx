import * as React from 'react'
import {IconButton} from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';

interface CopyButtonProps {
    value: string;
    timeout?: number;
}

export function CopyToClipboardButton({value, timeout = 2000, ...rest}: CopyButtonProps) {
    const [isCopied, setIsCopied] = React.useState(false);

    const onCopy = () => {
        if (isCopied) return;
        if (typeof window === 'undefined' || !navigator.clipboard?.writeText) {
            return;
        }
        if (!value) {
            return;
        }

        navigator.clipboard.writeText(value).then(() => {
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, timeout);
        });
    };

    return (
        <IconButton aria-label="delete" onClick={onCopy} {...rest}>
            <span>{isCopied ? <DoneIcon sx={{color: 'white', fontSize: '20px'}}/> : <ContentCopyIcon sx={{color: 'white', fontSize: '20px'}}/>}</span>
        </IconButton>
    );
}
