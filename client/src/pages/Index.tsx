import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/studymate/Sidebar';
import { ChatHeader } from '@/components/studymate/ChatHeader';
import { ChatArea } from '@/components/studymate/ChatArea';
import { MCQMode } from '@/components/studymate/MCQMode';
import { FlashcardMode } from '@/components/studymate/FlashcardMode';
import { useConversations } from '@/hooks/useConversations';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { useMCQ } from '@/hooks/useMCQ';
import { useFlashcards } from '@/hooks/useFlashcards';
import { Category, Mode, MCQQuestion, Flashcard, ContextDoc } from '@/types/chat';
import { callLLM, SYSTEM_PROMPTS, buildRAGContext, chunkText, extractTextFromFile } from '@/lib/api';
import { storage } from '@/lib/storage';
import { toast } from 'sonner';

export default function Index() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const {
    conversations, activeConversation, activeConversationId,
    setActiveConversationId, createConversation, deleteConversation,
    updateConversationCategory, addMessage, updateLastMessage,
    addContextDoc, removeContextDoc,
  } = useConversations();

  const mcq = useMCQ();
  const fc = useFlashcards();

  const getSystemPrompt = useCallback((conv: typeof activeConversation) => {
    if (!conv) return SYSTEM_PROMPTS.general(settings.language);
    const map: Record<string, (lang: string) => string> = {
      study: SYSTEM_PROMPTS.study,
      essay: SYSTEM_PROMPTS.essay,
      code: SYSTEM_PROMPTS.code,
      language: SYSTEM_PROMPTS.language,
      general: SYSTEM_PROMPTS.general,
    };
    return (map[conv.category] ?? SYSTEM_PROMPTS.general)(settings.language);
  }, [settings.language]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Create conversation if none active
    let convId = activeConversationId;
    let conv = activeConversation;
    if (!convId || !conv) {
      conv = createConversation('chat', 'general');
      convId = conv.id;
    }

    // Add user message
    addMessage(convId, content, 'user');
    setIsLoading(true);

    // RAG context injection
    const allChunks = (conv.contextDocs || []).flatMap(d => d.chunks);
    const ragContext = buildRAGContext(content, allChunks);
    const userContentWithRAG = ragContext ? content + ragContext : content;

    // History (last 10 messages for context window)
    const historyMsgs = (conv.messages || [])
      .filter(m => m.role !== 'system')
      .slice(-10)
      .map(m => ({ ...m }));
    // Replace last or append user message with RAG
    historyMsgs.push({ id: `u_${Date.now()}`, role: 'user' as const, content: userContentWithRAG, timestamp: new Date() });

    const systemPrompt = conv.mode === 'agent'
      ? SYSTEM_PROMPTS.studyAgent(content, settings.language)
      : getSystemPrompt(conv);

    // Add empty streaming placeholder
    addMessage(convId, '', 'assistant');

    try {
      let fullContent = '';

      if (settings.streamResponses) {
        await callLLM(historyMsgs, settings, systemPrompt, (chunk) => {
          fullContent += chunk;
          updateLastMessage(convId!, fullContent);
        });
      } else {
        const result = await callLLM(historyMsgs, settings, systemPrompt);
        fullContent = result.content;
        storage.addTokens(result.tokens, settings.model);
        updateLastMessage(convId!, fullContent);
      }
    } catch (err: any) {
      updateLastMessage(convId!, `⚠️ **Error:** ${err.message}\n\nPlease check your API key in Settings.`);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, activeConversation, isLoading, settings, addMessage, updateLastMessage, createConversation, getSystemPrompt]);

  const handleNewConversation = useCallback((mode: Mode) => {
    createConversation(mode);
    if (mode === 'mcq') mcq.reset();
    if (mode === 'flashcard') fc.reset();
  }, [createConversation, mcq, fc]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    mcq.reset();
    fc.reset();
  }, [setActiveConversationId, mcq, fc]);

  const handleDeleteConversation = useCallback(() => {
    if (activeConversationId) deleteConversation(activeConversationId);
  }, [activeConversationId, deleteConversation]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!activeConversationId) {
      toast.error('Start a conversation first');
      return;
    }
    try {
      toast.info(`Processing ${file.name}…`);
      const text = await extractTextFromFile(file);
      const chunks = chunkText(text);
      const doc: ContextDoc = {
        id: `doc_${Date.now()}`,
        name: file.name,
        content: text,
        chunks,
      };
      addContextDoc(activeConversationId, doc);
      toast.success(`✅ "${file.name}" added as context (${chunks.length} chunks)`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [activeConversationId, addContextDoc]);

  const handleGenerateMCQ = useCallback(async (topic: string, count: number) => {
    mcq.setLoading(true);
    try {
      const result = await callLLM(
        [{ id: 'q', role: 'user' as const, content: `Generate ${count} MCQ questions about: ${topic}`, timestamp: new Date() }],
        settings,
        SYSTEM_PROMPTS.mcqGenerator(topic, count),
      );
      const clean = result.content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      const questions: MCQQuestion[] = parsed.questions.map((q: any, i: number) => ({
        id: `q_${i}`, ...q,
      }));
      mcq.startSession(questions);
      toast.success(`Generated ${questions.length} questions!`);
    } catch (err: any) {
      toast.error(`Quiz generation failed: ${err.message}`);
    } finally {
      mcq.setLoading(false);
    }
  }, [settings, mcq]);

  const handleGenerateFlashcards = useCallback(async (text: string) => {
    mcq.setLoading(true); // reuse loading state
    try {
      const result = await callLLM(
        [{ id: 'f', role: 'user' as const, content: text, timestamp: new Date() }],
        settings,
        SYSTEM_PROMPTS.flashcardGenerator(text),
      );
      const clean = result.content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      const cards: Flashcard[] = parsed.cards.map((c: any, i: number) => ({
        id: `card_${i}`, reviewCount: 0, ...c,
      }));
      fc.startSession(cards);
      toast.success(`Created ${cards.length} flashcards!`);
    } catch (err: any) {
      toast.error(`Flashcard generation failed: ${err.message}`);
    } finally {
      mcq.setLoading(false);
    }
  }, [settings, mcq, fc]);

  const mode = activeConversation?.mode || 'chat';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={deleteConversation}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(s => !s)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ChatHeader
          conversation={activeConversation}
          settings={settings}
          onSettingsUpdate={updateSettings}
          onDelete={handleDeleteConversation}
          onCategoryChange={(cat: Category) =>
            activeConversationId && updateConversationCategory(activeConversationId, cat)
          }
          onToggleSidebar={() => setSidebarCollapsed(s => !s)}
          sidebarCollapsed={sidebarCollapsed}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onRemoveDoc={(docId) =>
            activeConversationId && removeContextDoc(activeConversationId, docId)
          }
        />

        {mode === 'mcq' ? (
          <MCQMode
            session={mcq.session}
            onAnswer={mcq.answerQuestion}
            onReset={mcq.reset}
            onGenerate={handleGenerateMCQ}
            loading={mcq.loading}
          />
        ) : mode === 'flashcard' ? (
          <FlashcardMode
            session={fc.session}
            onFlip={fc.flip}
            onRate={fc.rate}
            onReset={fc.reset}
            onGenerate={handleGenerateFlashcards}
            loading={mcq.loading}
          />
        ) : (
          <ChatArea
            conversation={activeConversation}
            onSendMessage={handleSendMessage}
            onNewMode={handleNewConversation}
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}
