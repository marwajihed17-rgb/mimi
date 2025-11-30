import { useState, useEffect } from 'react';
import { ChevronLeft, User, Trash2, LogOut, Paperclip, Send, Eye, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { FileCheck } from 'lucide-react';
import { sendToWebhook, generateSessionId } from '../config/webhooks';

interface DocumentProcessingProps {
  onBack: () => void;
  onLogout: () => void;
  username?: string;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export function DocumentProcessing({ onBack, onLogout, username = 'User' }: DocumentProcessingProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate unique session ID on component mount for chat isolation
  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  const handleSend = async () => {
    if (message.trim() || attachments.length > 0) {
      const userMessageText = message || `📎 ${attachments.length} file(s) attached`;
      const newMessage: Message = {
        id: Date.now(),
        text: userMessageText,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      // Add user message to chat
      setMessages(prev => [...prev, newMessage]);

      // Store message and attachments for webhook call
      const messageToSend = message;
      const filesToSend = attachments;

      // Clear input immediately for better UX
      setMessage('');
      setAttachments([]);
      setIsLoading(true);

      try {
        // Send message to n8n webhook
        const result = await sendToWebhook(
          'document',
          messageToSend || 'File attachment',
          filesToSend,
          sessionId
        );

        // Add webhook response to chat
        const botMessage: Message = {
          id: Date.now(),
          text: result.response,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);

        // Log error if webhook failed but still show user-friendly message
        if (!result.success && result.error) {
          console.error('Webhook error:', result.error);
        }
      } catch (error) {
        console.error('Failed to send message:', error);

        // Show error message to user
        const errorMessage: Message = {
          id: Date.now(),
          text: 'Sorry, I encountered an error processing your message. Please try again.',
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handlePreview = (file: File) => {
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-[#2a3144] bg-[#0f1419]/50 backdrop-blur-md shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-[#1a1f2e]"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A90F5] to-[#C74AFF] flex items-center justify-center animated-gradient">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white">Document Processing</h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-500 text-sm">Status</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1f2e]/50 rounded-lg mr-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4A90F5] to-[#C74AFF] flex items-center justify-center animated-gradient">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-sm">{username}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-[#1a1f2e]"
              onClick={handleClearMessages}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={onLogout}
              className="text-white hover:bg-[#1a1f2e] gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 hide-scrollbar">
        <div className="container mx-auto max-w-4xl h-full">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Start a conversation to begin processing</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] text-white animated-gradient'
                        : 'bg-[#1a1f2e]/80 backdrop-blur-md border border-[#2a3144] text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-[#2a3144] bg-[#0f1419]/50 backdrop-blur-md shrink-0">
        <div className="container mx-auto px-4 py-4">
          {/* Attachment Preview */}
          {attachments.length > 0 && (
            <div className="max-w-4xl mx-auto mb-3 flex gap-2 flex-wrap">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="bg-[#1a1f2e]/80 backdrop-blur-md border border-[#2a3144] rounded-lg px-3 py-2 flex items-center gap-2"
                >
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white truncate max-w-[150px]">{file.name}</span>
                  <button
                    onClick={() => handlePreview(file)}
                    className="text-gray-400 hover:text-blue-400 ml-1"
                    title="Preview file"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-gray-400 hover:text-white ml-1"
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <input
              type="file"
              id="file-input-document"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => document.getElementById('file-input-document')?.click()}
              className="text-gray-400 hover:bg-[#1a1f2e] shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-[#1a1f2e] border-[#2a3144] text-white placeholder:text-gray-500"
            />
            <Button
              onClick={handleSend}
              disabled={(!message.trim() && attachments.length === 0) || isLoading}
              className="shrink-0 bg-gradient-to-r from-[#4A90F5] to-[#C74AFF] hover:opacity-90 text-white animated-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-gray-600 text-xs text-center mt-3">
            Activer Windows
          </p>
          <p className="text-gray-600 text-xs text-center">
            Accédez aux paramètres pour activer Windows
          </p>
        </div>
      </footer>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closePreview}>
          <div className="bg-[#1a1f2e]/95 backdrop-blur-md border border-[#2a3144] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#2a3144]">
              <div className="flex items-center gap-3">
                <Paperclip className="w-5 h-5 text-gray-400" />
                <h3 className="text-white">{previewFile.name}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closePreview}
                className="text-gray-400 hover:text-white hover:bg-[#2a3144]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              {previewFile.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(previewFile)}
                  alt={previewFile.name}
                  className="max-w-full h-auto mx-auto rounded-lg"
                />
              ) : previewFile.type === 'application/pdf' ? (
                <iframe
                  src={URL.createObjectURL(previewFile)}
                  className="w-full h-[70vh] rounded-lg"
                  title={previewFile.name}
                />
              ) : previewFile.type.startsWith('text/') ? (
                <div className="bg-[#0f1419] rounded-lg p-4">
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                    {/* Text content would be loaded here */}
                    File preview: {previewFile.name}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Paperclip className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Preview not available for this file type</p>
                  <p className="text-gray-500 text-sm mt-2">Type: {previewFile.type || 'Unknown'}</p>
                  <p className="text-gray-500 text-sm">Size: {(previewFile.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
