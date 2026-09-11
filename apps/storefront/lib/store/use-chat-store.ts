import { create } from "zustand";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

export interface ProductContext {
  id: string;
  title: string;
  description: string;
  price: string | number;
  benefits?: string[];
  skin_types?: string[];
}

interface ChatStore {
  isOpen: boolean;
  messages: ChatMessage[];
  productContext: ProductContext | null;
  isLoading: boolean;
  
  openChat: (context?: ProductContext) => void;
  closeChat: () => void;
  toggleChat: () => void;
  addMessage: (msg: Omit<ChatMessage, "id" | "createdAt">) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  isOpen: false,
  messages: [],
  productContext: null,
  isLoading: false,

  openChat: (context?: ProductContext) => {
    const isCurrentlyOpen = get().isOpen;
    
    // Si on ouvre avec un NOUVEAU contexte produit, on ajoute un message d'accueil contextuel
    if (context && context.id !== get().productContext?.id) {
      set({ 
        isOpen: true, 
        productContext: context,
        messages: [
          ...get().messages,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `Avez-vous une question sur le produit **${context.title}** ? Je suis là pour vous aider !`,
            createdAt: new Date(),
          }
        ]
      });
    } else {
      set({ isOpen: true, productContext: context || get().productContext });
    }
  },

  closeChat: () => set({ isOpen: false }),
  
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  
  addMessage: (msg) => set((state) => ({
    messages: [
      ...state.messages,
      { ...msg, id: Date.now().toString() + Math.random(), createdAt: new Date() }
    ]
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  clearMessages: () => set({ messages: [], productContext: null }),
}));
