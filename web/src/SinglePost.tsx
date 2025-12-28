import useSWR, { mutate } from "swr";
import { useState } from "react";
import { FeedPost } from "./Post";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import { fetcher, API_URL } from "./App";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  MessageCircle,
  User,
  Send,
  Trash2,
} from "lucide-react";

// Decode JWT to get user ID
const getUserIdFromToken = (token: string): number | undefined => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub ? parseInt(decoded.sub) : undefined;
  } catch {
    return undefined;
  }
};

export const SinglePost = () => {
  const { postID } = useParams();
  const [cookies] = useCookies(["at"]);
  const at = cookies.at;
  const redirect = useNavigate();
  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentUserId = at ? getUserIdFromToken(at) : undefined;

  const { data, error, isLoading } = useSWR<{ data: FeedPost }>(
    "/posts/" + postID,
    at ? fetcher(at) : null
  );

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/posts/${postID}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${at}`,
        },
      });
      if (response.ok) {
        redirect("/"); // Go back to feed after deletion
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentContent.trim() || !at) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/posts/${postID}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${at}`,
        },
        body: JSON.stringify({ content: commentContent }),
      });

      if (response.ok) {
        setCommentContent("");
        mutate("/posts/" + postID); // Refresh the post data
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!at) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          Loading post...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load post</p>
          <Button
            onClick={() => redirect("/")}
            variant="outline"
            className="border-slate-600 text-slate-300"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const post = data.data;
  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => redirect("/")}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">Post</h1>
          </div>
          {currentUserId && post.user_id === currentUserId && (
            <Button
              onClick={handleDeletePost}
              disabled={deleting}
              variant="ghost"
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </Button>
          )}
        </div>
      </header>

      {/* Post Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {post.title || "Untitled"}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {date}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>
          </CardContent>
        </Card>

        {/* Add Comment */}
        <Card className="mt-8 bg-slate-800/50 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={2}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={submitting || !commentContent.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-500/25"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {submitting ? "Posting..." : "Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <div className="mt-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            Comments ({post.comments?.length || 0})
          </h2>

          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-3">
              {post.comments.map((comment) => (
                <Card
                  key={comment.id}
                  className="bg-slate-800/30 border-slate-700/50"
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {comment.user?.username || "Anonymous"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="py-8 text-center">
                <p className="text-slate-400">No comments yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};
