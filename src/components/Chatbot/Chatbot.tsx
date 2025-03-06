
import React, { useState, useRef, useEffect } from "react";
import { X, MessageSquare, Loader2, Maximize2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your restaurant dashboard assistant. How can I help you today?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    const userMessage: Message = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log("Calling chat-with-api function with messages:", [...messages, userMessage]);
      
      const { data, error } = await supabase.functions.invoke('chat-with-api', {
        body: { 
          messages: [...messages, userMessage].map(m => ({ 
            role: m.role, 
            content: m.content 
          })) 
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(`Function error: ${error.message}`);
      }

      if (!data) {
        throw new Error("No data returned from function");
      }

      console.log("Response data:", data);
      
      // Extract the assistant message from the response
      const assistantMessage = data.choices?.[0]?.message;
      
      if (assistantMessage && assistantMessage.content) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantMessage.content },
        ]);
      } else if (data.error) {
        throw new Error(`API error: ${data.error}`);
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      console.error("Error calling API:", error);
      
      // Show error message to user
      setMessages((prev) => [
        ...prev,
        { 
          role: "assistant", 
          content: "I'm sorry, I encountered an error. Please check that the API keys are configured correctly in the Supabase Edge Function secrets." 
        },
      ]);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response from API. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Extract the base64 part (remove the data:*/*;base64, prefix)
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
          } else {
            reject(new Error('Failed to read file as base64'));
          }
        };
        reader.onerror = reject;
      });

      // Send file to upload-image function
      const { data, error } = await supabase.functions.invoke('upload-image', {
        body: { base64Image: base64 },
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      if (!data || !data.image) {
        throw new Error("Failed to upload image");
      }

      // Add message with uploaded file info
      setMessages(prev => [
        ...prev,
        { 
          role: "user", 
          content: `I've uploaded a file named "${file.name}" for analysis.` 
        }
      ]);

      // Now send a message to the AI to analyze the file
      const imageUrl = data.image.url;
      
      setIsLoading(true);
      const analysisMessage = {
        role: "user" as const,
        content: `Please analyze this uploaded file: ${file.name}. The image is available at ${imageUrl}. Provide insights and a brief report for the restaurant owner.`
      };

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('chat-with-api', {
        body: { 
          messages: [...messages, analysisMessage].map(m => ({ 
            role: m.role, 
            content: m.content 
          })) 
        },
      });

      if (analysisError) {
        throw new Error(`Analysis error: ${analysisError.message}`);
      }

      const assistantMessage = analysisData.choices?.[0]?.message;
      
      if (assistantMessage && assistantMessage.content) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantMessage.content },
        ]);
      } else {
        throw new Error("Invalid analysis response from API");
      }

      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded and analyzed successfully.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload and analyze file.",
        variant: "destructive",
      });
      
      setMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "I'm sorry, I couldn't process your uploaded file. Please try again with a different file." 
        }
      ]);
    } finally {
      setIsUploading(false);
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const chatWindowClasses = isMaximized 
    ? "fixed inset-4 md:inset-10 h-auto w-auto max-w-none shadow-xl flex flex-col z-50 animate-in fade-in"
    : "fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] shadow-xl flex flex-col z-50 animate-in fade-in slide-in-from-bottom-10";

  return (
    <>
      {/* Chat bubble button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-purple-600 hover:bg-purple-700 text-white"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat window */}
      {isOpen && (
        <Card className={chatWindowClasses}>
          <div className="flex items-center justify-between border-b p-3 bg-purple-600 text-white rounded-t-lg">
            <h3 className="font-semibold">Restaurant Assistant</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMaximize}
                className="text-white hover:bg-purple-700"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-purple-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Assistant is typing...</p>
              </div>
            )}
            {isUploading && (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading and analyzing file...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t p-2 bg-background">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mb-2 text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" /> Upload File for Analysis
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="text-sm text-muted-foreground mb-2">
                  Upload a file for AI analysis
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="text-xs w-full"
                  accept="image/*,.csv,.xlsx,.pdf"
                  disabled={isUploading || isLoading}
                />
              </PopoverContent>
            </Popover>
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || isUploading} />
          </div>
        </Card>
      )}
    </>
  );
};

export default Chatbot;
