import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users } from "lucide-react";
import SocialFeed from "@/components/social/SocialFeed";
import GlobalChat from "@/components/social/GlobalChat";
import DirectMessages from "@/components/social/DirectMessages";

const Social = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("feed");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <h1 className="text-4xl font-bold mb-8 text-center">Social Hub</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Global Chat
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Direct Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-0">
            <SocialFeed />
          </TabsContent>

          <TabsContent value="global" className="mt-0">
            <GlobalChat />
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <DirectMessages />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Social;
