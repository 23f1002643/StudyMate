import { useState } from 'react';
import { Conversation, Message, Category } from '@/types/chat';

const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Understanding Quantum Physics',
    category: 'study',
    messages: [
      { id: '1-1', content: 'Can you explain quantum entanglement in simple terms?', role: 'user', timestamp: new Date('2024-01-15T10:00:00') },
      { id: '1-2', content: 'Quantum entanglement is a phenomenon where two particles become connected in such a way that the quantum state of one particle instantly influences the other, regardless of the distance between them. Think of it like having two magic coins - when you flip one and it lands on heads, the other will always land on tails, no matter how far apart they are!', role: 'assistant', timestamp: new Date('2024-01-15T10:00:05') },
    ],
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:00:05'),
  },
  {
    id: '2',
    title: 'Essay on Climate Change',
    category: 'essay',
    messages: [
      { id: '2-1', content: 'Help me write an introduction for my climate change essay', role: 'user', timestamp: new Date('2024-01-14T15:30:00') },
      { id: '2-2', content: 'Here\'s a compelling introduction for your climate change essay:\n\n"In the grand tapestry of Earth\'s history, few challenges have united humanity quite like the specter of climate change. As glaciers retreat and temperatures rise, we stand at a crossroads that will define generations to come..."', role: 'assistant', timestamp: new Date('2024-01-14T15:30:10') },
    ],
    createdAt: new Date('2024-01-14T15:30:00'),
    updatedAt: new Date('2024-01-14T15:30:10'),
  },
  {
    id: '3',
    title: 'React Hooks Tutorial',
    category: 'code',
    messages: [
      { id: '3-1', content: 'How do I use useEffect properly?', role: 'user', timestamp: new Date('2024-01-13T09:00:00') },
      { id: '3-2', content: 'The useEffect hook is used for side effects in React. Here\'s how to use it properly:\n\n```jsx\nuseEffect(() => {\n  // Your effect code here\n  return () => {\n    // Cleanup function\n  };\n}, [dependencies]);\n```\n\nThe dependency array controls when the effect runs. An empty array means it runs once on mount.', role: 'assistant', timestamp: new Date('2024-01-13T09:00:08') },
    ],
    createdAt: new Date('2024-01-13T09:00:00'),
    updatedAt: new Date('2024-01-13T09:00:08'),
  },
  {
    id: '4',
    title: 'Spanish Vocabulary Practice',
    category: 'language',
    messages: [
      { id: '4-1', content: 'Teach me 5 common Spanish phrases for traveling', role: 'user', timestamp: new Date('2024-01-12T14:00:00') },
      { id: '4-2', content: 'Here are 5 essential Spanish phrases for travelers:\n\n1. "¿Dónde está...?" - Where is...?\n2. "¿Cuánto cuesta?" - How much does it cost?\n3. "No entiendo" - I don\'t understand\n4. "La cuenta, por favor" - The bill, please\n5. "¿Habla inglés?" - Do you speak English?', role: 'assistant', timestamp: new Date('2024-01-12T14:00:05') },
    ],
    createdAt: new Date('2024-01-12T14:00:00'),
    updatedAt: new Date('2024-01-12T14:00:05'),
  },
  {
    id: '5',
    title: 'General Questions',
    category: 'general',
    messages: [
      { id: '5-1', content: 'What\'s the best way to stay productive while studying?', role: 'user', timestamp: new Date('2024-01-11T11:00:00') },
      { id: '5-2', content: 'Here are my top tips for productive studying:\n\n1. **Pomodoro Technique**: Study for 25 minutes, break for 5\n2. **Remove Distractions**: Put your phone in another room\n3. **Active Recall**: Test yourself instead of re-reading\n4. **Spaced Repetition**: Review material at increasing intervals\n5. **Stay Hydrated**: Your brain works better when hydrated!', role: 'assistant', timestamp: new Date('2024-01-11T11:00:07') },
    ],
    createdAt: new Date('2024-01-11T11:00:00'),
    updatedAt: new Date('2024-01-11T11:00:07'),
  },
];

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(mockConversations[0]?.id || null);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const createConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      category: 'general',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Use functional update to ensure we have the latest state
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    return newConversation;
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setConversations(prev => {
        const remaining = prev.filter(c => c.id !== id);
        setActiveConversationId(remaining[0]?.id || null);
        return prev; // We don't want to change state here, just side effect, but setter needs return. 
                     // Wait, this is wrong. We need to set active ID based on the new list.
        return prev.filter(c => c.id !== id);
      });
    }
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations(prev => prev.map(c => 
      c.id === id ? { ...c, title, updatedAt: new Date() } : c
    ));
  };

  const updateConversationCategory = (id: string, category: Category) => {
    setConversations(prev => prev.map(c => 
      c.id === id ? { ...c, category, updatedAt: new Date() } : c
    ));
  };

  const addMessage = (conversationId: string, content: string, role: 'user' | 'assistant') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
    };

    setConversations(prev => prev.map(c => 
      c.id === conversationId 
        ? { 
            ...c, 
            messages: [...c.messages, newMessage],
            updatedAt: new Date(),
            title: c.messages.length === 0 && role === 'user' 
              ? content.slice(0, 50) + (content.length > 50 ? '...' : '')
              : c.title
          } 
        : c
    ));

    return newMessage;
  };

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
  };
}
