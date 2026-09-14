'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bot, Send, User, Lightbulb, Sparkles } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const exampleQuestions = [
  { label: 'O que faço hoje?', prompt: 'O que faço no meu treino de hoje?' },
  { label: 'Posso aumentar carga?', prompt: 'Posso aumentar a carga no supino?' },
  { label: 'Analisar evolução', prompt: 'Analise minha evolução nas últimas 8 semanas' },
  { label: 'Estou sentindo dor', prompt: 'Estou sentindo dor no cotovelo direito' },
]

export default function CoachPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Simular resposta da IA (placeholder)
    // Na implementação real, isso chamaria uma Edge Function que usa a IA
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(messageText),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setLoading(false)
    }, 1500)
  }

  const getAIResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase()
    
    if (lowerQuestion.includes('o que faço hoje') || lowerQuestion.includes('treino hoje')) {
      return `Para definir o treino ideal, preciso saber qual treino está na sua programação para hoje. Geralmente, seguindo um programa de Full Body ou Upper/Lower, você teria um próximo treino na sequência.\n\n💡 **Dica**: Complete seu perfil com seus objetivos e dias disponíveis para receber recomendações personalizadas!`
    }
    
    if (lowerQuestion.includes('aumentar') && (lowerQuestion.includes('supino') || lowerQuestion.includes('carga'))) {
      return `Para avaliar se você pode aumentar a carga no supino, preciso analisar seu histórico recente. \n\nNo momento, recomendo:\n1. Verificar se você está conseguindo fazer todas as séries com RIR 2 ou menos\n2. Se sim há pelo menos 2 sessões consecutivas, pode aumentar 2,5-5 kg\n3. Always prioritize good form over heavier weights\n\n📊 Quer que eu analise seu histórico de supino?`
    }
    
    if (lowerQuestion.includes('dor') || lowerQuestion.includes('cotovelo') || lowerQuestion.includes('joelho')) {
      return `⚠️ **Importante**: Não sou médico, mas posso dar algumas orientações gerais.\n\n**Se você está sentindo dor:**\n1. **Pare** o exercício que causa dor imediatamente\n2. **Descanse** por alguns dias\n3. **Aplique** gelo se houver inflamação\n4. **Consulte** um profissional se a dor persistir\n\n💡 Documente a dor no app para acompanhamento. Isso me ajuda a adaptar seus treinos no futuro.`
    }
    
    if (lowerQuestion.includes('evolução') || lowerQuestion.includes('progresso')) {
      return `Para analisar sua evolução, preciso de acesso ao seu histórico de treinos.\n\n**No que posso ajudar agora:**\n- Verificar se há progressão de carga nos principais exercícios\n- Analisar aderência ao programa\n- Identificar exercícios que estão estagnados\n\n📈 Acompanhe também a aba "Evolução" no menu para ver suas estatísticas!`
    }

    return `Entendi sua pergunta sobre "${question}".\n\nComo seu coach virtual, posso ajudar com:\n\n🏋️ **Treinos**\n- Sugerir exercícios do seu programa\n- Adaptar treinos para tempo disponível\n- Substituir exercícios por alternativas\n\n📊 **Análise**\n- Avaliar progressão\n- Revisar técnica\n- Interpretar resultados\n\n💡 **Dica**: Seja específico! Quanto mais detalhes você der (exercício, carga atual, sintomas), melhor posso ajudar.`
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center">
            <Bot className="w-5 h-5 text-white dark:text-zinc-900" />
          </div>
          <div>
            <h1 className="font-semibold">Coach IA</h1>
            <p className="text-sm text-zinc-500">Seu assistente de treino</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-6">
            <Card className="bg-zinc-50 dark:bg-zinc-900 border-0">
              <CardContent className="py-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-zinc-900 dark:text-white" />
                  <h3 className="font-semibold">Olá! Sou seu Coach IA</h3>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Posso ajudar com recomendações de treino, análise de progressão,
                  resposta a dúvidas sobre exercícios e muito mais.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <p className="text-sm text-zinc-500 px-2">Perguntas frequentes:</p>
              {exampleQuestions.map((q) => (
                <button
                  key={q.label}
                  onClick={() => sendMessage(q.prompt)}
                  className="w-full text-left p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm">{q.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-2 max-w-[85%] ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-zinc-900 dark:text-white" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-zinc-900 text-white rounded-tr-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-zinc-900 dark:text-white" />
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 rounded-tl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua pergunta..."
            className="flex-1 h-12 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
          />
          <Button size="icon" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
