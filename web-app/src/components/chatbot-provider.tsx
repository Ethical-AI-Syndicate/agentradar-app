'use client';

import { useState } from 'react';
import { Chatbot } from './chatbot';

interface ChatbotProviderProps {
  children: React.ReactNode;
}

export function ChatbotProvider({ children }: ChatbotProviderProps) {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  return (
    <>
      {children}
      <Chatbot isOpen={isChatbotOpen} onToggle={toggleChatbot} />
    </>
  );
}