import './InteractionPrompt.css';

interface InteractionPromptProps {
  message: string;
  visible: boolean;
  keyLabel?: string;
}

export function InteractionPrompt({ message, visible, keyLabel = 'Space' }: InteractionPromptProps) {
  if (!visible) return null;

  return (
    <div className="interaction-prompt">
      <div className="prompt-content">
        <span className="prompt-key">{keyLabel}</span>
        <span className="prompt-message">{message}</span>
      </div>
    </div>
  );
}

