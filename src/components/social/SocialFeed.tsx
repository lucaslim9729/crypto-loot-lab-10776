import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import PostComments from "./PostComments";

interface Post {
  id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
  };
}

const SocialFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
    loadPosts();
    loadLikedPosts();
    
    const channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadPosts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => {
        loadPosts();
        loadLikedPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load posts");
      return;
    }

    // Load profiles for each post
    if (data) {
      const userIds = [...new Set(data.map(post => post.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const postsWithProfiles = data.map(post => ({
        ...post,
        profiles: profileMap.get(post.user_id) || { username: "Unknown" }
      }));

      setPosts(postsWithProfiles);
    }
  };

  const loadLikedPosts = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id);

    if (data) {
      setLikedPosts(new Set(data.map(like => like.post_id)));
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("posts")
      .insert({ content: newPost, user_id: user.id });

    if (error) {
      toast.error("Failed to create post");
    } else {
      setNewPost("");
      toast.success("Post created!");
    }
    setLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const isLiked = likedPosts.has(postId);

    if (isLiked) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (!error) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    } else {
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: user.id });

      if (!error) {
        setLikedPosts(prev => new Set(prev).add(postId));
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="p-6">
        <Textarea
          placeholder="What's on your mind?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          className="min-h-24 mb-4"
        />
        <Button onClick={handleCreatePost} disabled={loading || !newPost.trim()}>
          <Send className="h-4 w-4 mr-2" />
          Post
        </Button>
      </Card>

      {posts.map((post) => (
        <Card key={post.id} className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{post.profiles?.username}</span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="mb-4 whitespace-pre-wrap">{post.content}</p>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className={likedPosts.has(post.id) ? "text-red-500" : ""}
                >
                  <Heart className={`h-4 w-4 mr-1 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                  {post.likes_count}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.comments_count}
                </Button>
              </div>

              {selectedPostId === post.id && (
                <PostComments postId={post.id} userId={user?.id} />
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SocialFeed;
