import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  message: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

const GlobalChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUser();
    loadMessages();

    const channel = supabase
      .channel('global-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'global_chat_messages'
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("global_chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (!error && data) {
      // Load profiles for messages
      const userIds = [...new Set(data.map(msg => msg.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const messagesWithProfiles = data.map(msg => ({
        ...msg,
        profiles: profileMap.get(msg.user_id) || { username: "Unknown" }
      }));

      setMessages(messagesWithProfiles);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from("global_chat_messages")
      .insert({
        user_id: user.id,
        message: newMessage
      });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Global Chat</h2>
        
        <ScrollArea className="h-[500px] mb-4 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{msg.profiles?.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm bg-muted rounded-lg px-3 py-2 inline-block max-w-[80%]">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default GlobalChat;
