import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Search } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  message: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
}

const DirectMessages = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser && currentUser) {
      loadMessages();

      const channel = supabase
        .channel(`dm-${selectedUser.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${selectedUser.id},receiver_id=eq.${currentUser.id}`
        }, () => {
          loadMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser, currentUser]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username")
      .order("username");

    if (!error && data) {
      setUsers(data);
    }
  };

  const loadMessages = async () => {
    if (!selectedUser || !currentUser) return;

    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      markAsRead();
    }
  };

  const markAsRead = async () => {
    if (!selectedUser || !currentUser) return;

    await supabase
      .from("direct_messages")
      .update({ is_read: true })
      .eq("receiver_id", currentUser.id)
      .eq("sender_id", selectedUser.id)
      .eq("is_read", false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    const { error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        message: newMessage
      });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
      loadMessages();
    }
  };

  const filteredUsers = users.filter(user =>
    user.id !== currentUser?.id &&
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
      <Card className="md:col-span-1 p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <Button
                key={user.id}
                variant={selectedUser?.id === user.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedUser(user)}
              >
                {user.username}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="md:col-span-2 p-4">
        {selectedUser ? (
          <>
            <h3 className="text-xl font-semibold mb-4">{selectedUser.username}</h3>
            
            <ScrollArea className="h-[400px] mb-4 pr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender_id === currentUser?.id ? 'items-end' : 'items-start'}`}
                  >
                    <p className={`text-sm rounded-lg px-3 py-2 max-w-[80%] ${
                      msg.sender_id === currentUser?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {msg.message}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </span>
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
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a user to start messaging
          </div>
        )}
      </Card>
    </div>
  );
};

export default DirectMessages;
