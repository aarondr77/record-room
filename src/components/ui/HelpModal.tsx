import { useEffect } from 'react';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="help-modal-close" onClick={onClose}>×</button>
        
        <h2 className="help-modal-title">How to Play</h2>
        
        <ol className="help-modal-instructions">
          <li>Move the cat to a platform then press <span className="help-key">Space</span> to open the record and see the notes</li>
          <li>Leave your own note.</li>
          <li>Go to a toy and press <span className="help-key">Space</span> to pick it up</li>
          <li>Press <span className="help-key">D</span> to drop the toy</li>
        </ol>
      </div>
    </div>
  );
}

