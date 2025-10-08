import * as React from "react";
import { IconButton } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DoneIcon from "@mui/icons-material/Done";
import copy from "copy-to-clipboard";

interface CopyButtonProps {
  value: string;
  timeout?: number;
  color: string;
}

export function CopyToClipboardButton({
  value,
  color,
  timeout = 2000,
  ...rest
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  const markCopied = React.useCallback(() => {
    setIsCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => setIsCopied(false),
      timeout || 0,
    );
  }, [timeout]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const onCopy = React.useCallback(() => {
    if (!value || isCopied) return;
    if (copy(value, { format: "text/plain" })) {
      markCopied();
    }
  }, [value, isCopied, markCopied]);

  return (
    <IconButton aria-label="delete" onClick={onCopy} {...rest}>
      <span>
        {isCopied ? (
          <DoneIcon sx={{ color: color, fontSize: "20px" }} />
        ) : (
          <ContentCopyIcon sx={{ color: color, fontSize: "20px" }} />
        )}
      </span>
    </IconButton>
  );
}
