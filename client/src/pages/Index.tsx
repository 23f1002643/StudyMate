import { useState } from 'react';
import { Sidebar } from '@/components/studymate/Sidebar';
import { ChatHeader } from '@/components/studymate/ChatHeader';
import { ChatArea } from '@/components/studymate/ChatArea';
import { useConversations } from '@/hooks/useConversations';
import { useTheme } from '@/hooks/useTheme';
import { Category } from '@/types/chat';

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  
  const {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    updateConversationCategory,
    addMessage,
  } = useConversations();

  const handleSendMessage = (content: string) => {
    let conversationId = activeConversationId;
    
    if (!conversationId) {
      const newConv = createConversation();
      conversationId = newConv.id;
    }
    
    addMessage(conversationId!, content, 'user');
    
    // Simulate AI response (mock for now)
    setTimeout(() => {
      const responses = [
        "That's a great question! Let me help you understand this better...",
        "I'd be happy to help with that! Here's what you need to know...",
        "Interesting topic! Here's my explanation...",
        "Let me break this down for you step by step...",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage(conversationId!, `${randomResponse}\n\nThis is a mock response. In a real app, this would call an LLM API.`, 'assistant');
    }, 1000);
  };

  const handleDeleteConversation = () => {
    if (activeConversationId) {
      deleteConversation(activeConversationId);
    }
  };

  const handleCategoryChange = (category: Category) => {
    if (activeConversationId) {
      updateConversationCategory(activeConversationId, category);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={createConversation}
        onDeleteConversation={deleteConversation}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <ChatHeader
          conversation={activeConversation}
          onDelete={handleDeleteConversation}
          onCategoryChange={handleCategoryChange}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        
        <ChatArea
          conversation={activeConversation}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
};

export default Index;
