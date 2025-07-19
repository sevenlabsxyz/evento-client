"use client";
import { SheetWithDetent } from "@/components/ui/sheet-with-detent";
import { VisuallyHidden } from "@silk-hq/components";
import { useState } from "react";
import "./contact-host-sheet.css";

interface ContactHostSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

export default function ContactHostSheet({
  isOpen,
  onClose,
  onSendMessage,
}: ContactHostSheetProps) {
  const [activeDetent, setActiveDetent] = useState(1);
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
      onClose();
    }
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  return (
    <SheetWithDetent.Root
      presented={isOpen}
      onPresentedChange={(presented) => !presented && handleClose()}
      activeDetent={activeDetent}
      onActiveDetentChange={setActiveDetent}
    >
      <SheetWithDetent.Portal>
        <SheetWithDetent.View>
          <SheetWithDetent.Backdrop />
          <SheetWithDetent.Content className="ContactHostSheet-content">
            <div className="ContactHostSheet-header">
              <SheetWithDetent.Handle className="ContactHostSheet-handle" />
              <div className="ContactHostSheet-headerBar">
                <button
                  onClick={handleClose}
                  className="ContactHostSheet-headerButton ContactHostSheet-headerButton--cancel"
                >
                  Cancel
                </button>
                <h2 className="ContactHostSheet-headerTitle">Contact Host</h2>
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="ContactHostSheet-headerButton ContactHostSheet-headerButton--send"
                >
                  Send
                </button>
              </div>
              <VisuallyHidden.Root asChild>
                <SheetWithDetent.Title>Contact Host</SheetWithDetent.Title>
              </VisuallyHidden.Root>
            </div>
            <SheetWithDetent.ScrollRoot asChild>
              <SheetWithDetent.ScrollView className="ContactHostSheet-scrollView">
                <SheetWithDetent.ScrollContent className="ContactHostSheet-scrollContent">
                  <div className="ContactHostSheet-form">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please enter your question for the host..."
                      className="ContactHostSheet-textarea"
                      autoFocus
                      onFocus={() => setActiveDetent(2)}
                    />
                  </div>
                </SheetWithDetent.ScrollContent>
              </SheetWithDetent.ScrollView>
            </SheetWithDetent.ScrollRoot>
          </SheetWithDetent.Content>
        </SheetWithDetent.View>
      </SheetWithDetent.Portal>
    </SheetWithDetent.Root>
  );
}
