"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {  X, PaperPlaneRight, CaretDown, ChatTeardropText } from "@phosphor-icons/react";
import { IconIA } from "@/components/ui/icons/IconIA";
import { useChatStore, MessageRole } from "@/lib/store/use-chat-store";
import ReactMarkdown from "react-markdown";

export function ChatWidget() {
  const { isOpen, messages, productContext, isLoading, toggleChat, closeChat, addMessage, setLoading } = useChatStore();
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userText = input.trim();
    setInput("");
    
    // Optimistic update
    addMessage({ role: "user", content: userText });
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: useChatStore.getState().messages.map(m => ({ role: m.role, content: m.content })),
          productContext
        })
      });

      if (!response.ok) throw new Error("API Error");

      const data = await response.json();
      addMessage({ role: "assistant", content: data.reply });
    } catch (e) {
      addMessage({ role: "assistant", content: "Désolé, je rencontre des difficultés techniques. Veuillez réessayer." });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#2A2424] text-white shadow-xl flex items-center justify-center overflow-hidden"
          >
            {/* Soft pulse background */}
            <div className="absolute inset-0 bg-[#E5B6B9]/20 animate-pulse rounded-full" />
            <IconIA className="w-8 h-8 z-10" />
            
            {/* Tooltip hint on hover (desktop only) */}
            <div className="absolute -top-10 right-0 bg-white text-[#2A2424] text-xs font-bold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap opacity-0 md:hover:opacity-100 transition-opacity pointer-events-none">
              Besoin d'aide ?
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[550px] w-full h-[100dvh] bg-white sm:rounded-3xl shadow-2xl sm:border border-[#EDE0E0] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#2A2424] px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E5B6B9]/20 flex items-center justify-center">
                  <IconIA className="w-5 h-5 text-[#E5B6B9]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Assistant The Welfare</h3>
                  {productContext ? (
                    <p className="text-[10px] text-white/60 line-clamp-1">Support produit en cours</p>
                  ) : (
                    <p className="text-[10px] text-white/60 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> En ligne
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={closeChat}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
              >
                <CaretDown className="w-4 h-4" />
              </button>
            </div>

            {/* Context Banner (If product context active) */}
            {productContext && (
              <div className="bg-[#F8F5F2] px-4 py-2 border-b border-[#EDE0E0] shrink-0 flex items-center gap-2">
                <span className="text-xs font-bold text-[#2A2424] whitespace-nowrap">Produit :</span>
                <span className="text-[11px] text-[#2A2424]/70 truncate">{productContext.title}</span>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#FDFDFC]">
              {messages.length === 0 && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                  <ChatTeardropText className="w-10 h-10 text-[#2A2424] mb-3" weight="light" />
                  <p className="text-sm text-[#2A2424] max-w-[200px]">
                    Posez vos questions sur nos produits, le type de peau idéal, ou nos services.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-[#E5B6B9]/20 flex items-center justify-center shrink-0 mr-2 mt-auto border border-[#E5B6B9]/40">
                      <IconIA className="w-4 h-4 text-[#C2164A]" />
                    </div>
                  )}
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-[13px] max-w-[80%] leading-relaxed shadow-sm prose prose-sm prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0 ${
                      msg.role === "user" 
                        ? "bg-[#2A2424] text-white rounded-br-sm prose-invert" 
                        : "bg-white border border-[#EDE0E0] text-[#2A2424] rounded-bl-sm"
                    }`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="w-6 h-6 rounded-full bg-[#E5B6B9]/20 flex items-center justify-center shrink-0 mr-2 border border-[#E5B6B9]/40">
                    <IconIA className="w-4 h-4 text-[#C2164A]" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-[#EDE0E0] rounded-bl-sm flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-[#2A2424]/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-[#2A2424]/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-[#2A2424]/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-[#EDE0E0] shrink-0">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrivez votre message..."
                  className="w-full bg-[#F8F5F2] border-none rounded-xl pl-4 pr-12 py-3.5 text-sm text-[#2A2424] focus:ring-2 focus:ring-[#E5B6B9]/50 outline-none transition-all placeholder:text-[#2A2424]/30"
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 w-9 h-9 flex items-center justify-center bg-[#2A2424] text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:hover:bg-[#2A2424] transition-colors"
                >
                  <PaperPlaneRight className="w-4 h-4" weight="fill" />
                </button>
              </div>
              <p className="text-[9px] text-center text-[#2A2424]/40 mt-3 font-medium uppercase tracking-wider">
                Propulsé par The Welfare IA
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
