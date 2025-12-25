import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MessageCircle, Calendar, Tag } from "lucide-react";

interface PostComment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user?: {
    id: number;
    username: string;
  };
}

export interface FeedPost {
  id: number;
  user_id: number;
  comments_count: number;
  content: string;
  created_at: string;
  tags: string[];
  title?: string;
  username?: string;
  comments?: PostComment[];
}

interface PostProps {
  post: FeedPost;
  onClick: () => void;
}

export const Post: React.FC<PostProps> = ({ post, onClick }) => (
  <Card
    onClick={onClick}
    className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/70 transition-all cursor-pointer group"
  >
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
            {post.title || "Untitled"}
          </h2>
          {post.username && (
            <p className="text-sm text-slate-400 mt-1">@{post.username}</p>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent className="pb-3">
      <p className="text-slate-300 line-clamp-3">{post.content}</p>
    </CardContent>
    <CardFooter className="flex items-center justify-between text-sm text-slate-400 border-t border-slate-700/50 pt-4">
      <div className="flex items-center gap-4">
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            <span className="truncate max-w-[150px]">{post.tags.join(", ")}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-cyan-400">
        <MessageCircle className="w-4 h-4" />
        <span>{post.comments_count}</span>
      </div>
    </CardFooter>
  </Card>
);
