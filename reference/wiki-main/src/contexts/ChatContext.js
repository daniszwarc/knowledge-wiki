import { createContext, useContext, useState, useCallback } from "react";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [pendingContext, setPendingContext] = useState("");
  const [pendingInput, setPendingInput] = useState("");

  const openChat = useCallback((selectedText) => {
    if (selectedText) {
      setPendingContext(selectedText);
    }
    setChatOpen(true);
  }, []);

  const openChatWithInput = useCallback((text) => {
    if (text) {
      setPendingInput(text);
    }
    setChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setChatOpen(false);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chatOpen,
        openChat,
        openChatWithInput,
        closeChat,
        messages,
        setMessages,
        pendingContext,
        setPendingContext,
        pendingInput,
        setPendingInput,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
