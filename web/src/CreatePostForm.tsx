import { useState } from "react";
import { API_URL } from "./App";
import { useCookies } from "react-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, PenLine } from "lucide-react";

interface CreatePostFormProps {
  onFetchPosts: () => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ onFetchPosts }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const [cookies] = useCookies(["at"]);
  const at = cookies.at;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    
    setLoading(true);
    try {
      await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${at}`,
        },
        body: JSON.stringify({ title, content }),
      });

      setTitle("");
      setContent("");
      onFetchPosts();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <PenLine className="w-5 h-5 text-cyan-400" />
          Create Post
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="What's on your mind?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
        />
        <Textarea
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-500/25"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {loading ? "Posting..." : "Post"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
