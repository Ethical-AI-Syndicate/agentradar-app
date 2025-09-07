'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Chatbot({ isOpen, onToggle }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm AgentRadar's AI assistant. I can help you with questions about our real estate intelligence platform, pricing, features, or getting started. What would you like to know?",
      type: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Simulate RAG-based AI response
  const generateResponse = async (userMessage: string): Promise<string> => {
    // In production, this would:
    // 1. Send user query to vector database to find relevant documents
    // 2. Use retrieved context + user query to prompt an LLM
    // 3. Return the LLM's response
    
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple keyword-based responses for demo
    if (lowerMessage.includes('pricing') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      return "AgentRadar offers flexible pricing: Individual agents pay $99/month, teams (5+ agents) get $79/month per agent, and enterprise (50+ agents) costs $49/month per agent. All plans include unlimited property alerts, court filing intelligence, and mobile/web access. Would you like me to help you choose the right plan?";
    }
    
    if (lowerMessage.includes('trial') || lowerMessage.includes('free')) {
      return "Yes! We offer a 14-day free trial with no credit card required. You'll get full access to all features including property alerts, court filing intelligence, and market analytics. Would you like me to help you get started?";
    }
    
    if (lowerMessage.includes('court') || lowerMessage.includes('filing') || lowerMessage.includes('power of sale')) {
      return "AgentRadar monitors court filings across Ontario to identify power of sale properties, foreclosures, and estate sales 6-12 months before they hit MLS. Our AI analyzes legal documents and extracts property details, giving you a significant competitive advantage. You'll receive real-time alerts when properties match your criteria.";
    }
    
    if (lowerMessage.includes('mobile') || lowerMessage.includes('app')) {
      return "Our mobile app is currently in development and will launch in Q1 2026. It will include push notifications for new opportunities, mobile-optimized property details, and the ability to save and share properties. Currently, our web platform is fully responsive and works great on mobile browsers.";
    }
    
    if (lowerMessage.includes('integration') || lowerMessage.includes('crm') || lowerMessage.includes('api')) {
      return "AgentRadar offers API access for enterprise clients to integrate with existing CRM systems. We also provide webhook notifications and can export data in various formats. Our team can help with custom integrations for larger organizations. Would you like to discuss your specific integration needs?";
    }
    
    if (lowerMessage.includes('support') || lowerMessage.includes('help')) {
      return "We provide comprehensive support including email support, live chat during business hours, video onboarding sessions, and a detailed help center. Enterprise clients get dedicated support and priority response times. You can also schedule a call with our founder Mike Holownych directly.";
    }
    
    if (lowerMessage.includes('data') || lowerMessage.includes('source')) {
      return "AgentRadar aggregates data from multiple sources: Ontario court systems for power of sale and foreclosure filings, municipal databases for development applications, probate court records for estate sales, and public property records. All data is processed by our AI to extract relevant information and scored for investment potential.";
    }

    if (lowerMessage.includes('investor') || lowerMessage.includes('investment') || lowerMessage.includes('funding')) {
      return "AgentRadar is currently seeking pre-seed angel investment of $500K - $1.2M to accelerate growth and expand across Canada. We have a clear path to revenue with strong early traction. If you're interested in learning more about this investment opportunity, I can connect you with our founder Mike Holownych.";
    }
    
    // Default response
    return "I'd be happy to help you with information about AgentRadar! I can answer questions about our pricing, features, court filing intelligence, mobile apps, integrations, support options, or getting started. You can also ask me about specific real estate investment strategies or how our platform works. What specifically would you like to know?";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const response = await generateResponse(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        type: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or feel free to contact our support team directly.",
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 bg-gradient-to-r from-blue-600 to-orange-600 hover:scale-110 transition-transform shadow-lg z-50"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] z-50">
      <Card className="shadow-2xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-orange-600 text-white rounded-t-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <CardTitle className="text-lg">AgentRadar AI Assistant</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-blue-100 mt-1">
            Usually responds in a few seconds
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="p-0">
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-gray-200'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about AgentRadar..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-orange-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Powered by AI • For complex questions, <a href="/contact" className="text-blue-600 hover:underline">contact us directly</a>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}