import { useState, useCallback } from 'react';
import { Conversation, Message, Category, Mode, ContextDoc } from '@/types/chat';
import { storage } from '@/lib/storage';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(() => 
    storage.getConversations()
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const saved = storage.getConversations();
    return saved[0]?.id || null;
  });

  const save = useCallback((convs: Conversation[]) => {
    setConversations(convs);
    storage.saveConversations(convs);
  }, []);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const createConversation = useCallback((mode: Mode = 'chat', category: Category = 'general') => {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}`,
      title: 'New Conversation',
      category,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      mode,
      contextDocs: [],
      totalTokens: 0,
    };
    const updated = [newConversation, ...conversations];
    save(updated);
    setActiveConversationId(newConversation.id);
    return newConversation;
  }, [conversations, save]);

  const deleteConversation = useCallback((id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    save(updated);
    if (activeConversationId === id) {
      setActiveConversationId(updated[0]?.id || null);
    }
  }, [conversations, save, activeConversationId]);

  const updateConversationTitle = useCallback((id: string, title: string) => {
    const updated = conversations.map(c =>
      c.id === id ? { ...c, title, updatedAt: new Date() } : c
    );
    save(updated);
  }, [conversations, save]);

  const updateConversationCategory = useCallback((id: string, category: Category) => {
    const updated = conversations.map(c =>
      c.id === id ? { ...c, category, updatedAt: new Date() } : c
    );
    save(updated);
  }, [conversations, save]);

  const addMessage = useCallback((
    conversationId: string,
    content: string,
    role: 'user' | 'assistant',
    tokens?: number,
  ) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      content,
      role,
      timestamp: new Date(),
      tokens,
    };

    const updated = conversations.map(c => {
      if (c.id !== conversationId) return c;
      const autoTitle = c.messages.length === 0 && role === 'user'
        ? content.slice(0, 50) + (content.length > 50 ? '…' : '')
        : c.title;
      return {
        ...c,
        messages: [...c.messages, newMessage],
        title: autoTitle,
        updatedAt: new Date(),
        totalTokens: (c.totalTokens || 0) + (tokens || 0),
      };
    });
    save(updated);
    return newMessage;
  }, [conversations, save]);

  const updateLastMessage = useCallback((conversationId: string, content: string) => {
    const updated = conversations.map(c => {
      if (c.id !== conversationId) return c;
      const messages = [...c.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = { ...messages[messages.length - 1], content };
      }
      return { ...c, messages, updatedAt: new Date() };
    });
    save(updated);
  }, [conversations, save]);

  const addContextDoc = useCallback((conversationId: string, doc: ContextDoc) => {
    const updated = conversations.map(c => {
      if (c.id !== conversationId) return c;
      return { ...c, contextDocs: [...(c.contextDocs || []), doc] };
    });
    save(updated);
  }, [conversations, save]);

  const removeContextDoc = useCallback((conversationId: string, docId: string) => {
    const updated = conversations.map(c => {
      if (c.id !== conversationId) return c;
      return { ...c, contextDocs: (c.contextDocs || []).filter(d => d.id !== docId) };
    });
    save(updated);
  }, [conversations, save]);

  const clearAll = useCallback(() => {
    save([]);
    setActiveConversationId(null);
  }, [save]);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    updateConversationCategory,
    addMessage,
    updateLastMessage,
    addContextDoc,
    removeContextDoc,
    clearAll,
  };
}
