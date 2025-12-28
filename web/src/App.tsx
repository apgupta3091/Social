import useSWR, { mutate } from "swr";
import { useState } from "react";
import { FeedPost, Post } from "./Post";
import { useCookies } from "react-cookie";
import { Navigate, useNavigate } from "react-router-dom";
import { CreatePostForm } from "./CreatePostForm";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronLeft, ChevronRight, Users } from "lucide-react";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/v1";

export const fetcher = (at: string) => (url: string) =>
  fetch(API_URL + url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${at}`,
    },
  }).then((r) => r.json());

// Decode JWT to get user ID (simple base64 decode of payload)
const getUserIdFromToken = (token: string): number | undefined => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub ? parseInt(decoded.sub) : undefined;
  } catch {
    return undefined;
  }
};

const POSTS_PER_PAGE = 10;

function App() {
  const [cookies, setCookie] = useCookies(["at"]);
  const at = cookies.at;
  const redirect = useNavigate();
  const [page, setPage] = useState(0);

  const currentUserId = at ? getUserIdFromToken(at) : undefined;

  const offset = page * POSTS_PER_PAGE;
  const feedUrl = `/users/feed?limit=${POSTS_PER_PAGE}&offset=${offset}`;

  const { data, error, isLoading } = useSWR<{ data: FeedPost[] }>(
    feedUrl,
    at ? fetcher(at) : null
  );

  if (!at) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    setCookie("at", "");
    redirect("/login");
  };

  const reFetchData = () => {
    setPage(0); // Go back to first page to see new post
    mutate(`/users/feed?limit=${POSTS_PER_PAGE}&offset=0`);
  };

  const handlePrevPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (data?.data?.length === POSTS_PER_PAGE) {
      setPage(page + 1);
    }
  };

  const hasNextPage = data?.data?.length === POSTS_PER_PAGE;
  const hasPrevPage = page > 0;

  const handleClickPost = (id: number) => () => redirect(`/post/${id}`);

  const handleDeletePost = async (postId: number) => {
    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${at}`,
        },
      });
      if (response.ok) {
        mutate(feedUrl); // Refresh the feed
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-xl">🐿️</span>
            </div>
            <h1 className="text-xl font-bold text-white">GopherSocial</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => redirect("/users")}
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Create Post */}
        <CreatePostForm onFetchPosts={reFetchData} />

        {/* Feed */}
        <div className="mt-8 space-y-4">
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2 text-slate-400">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Loading your feed...
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-400">
                Failed to load feed. Please try again.
              </p>
            </div>
          )}

          {data?.data?.map((post) => (
            <Post
              key={post.id}
              post={post}
              onClick={handleClickPost(post.id)}
              currentUserId={currentUserId}
              onDelete={handleDeletePost}
            />
          ))}

          {data?.data?.length === 0 && page === 0 && (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400">No posts yet.</p>
              <p className="text-slate-500 text-sm mt-1">
                Follow someone or create your first post!
              </p>
            </div>
          )}

          {data?.data?.length === 0 && page > 0 && (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400">No more posts.</p>
            </div>
          )}

          {/* Pagination Controls - always show when there are posts */}
          {data?.data && data.data.length > 0 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                onClick={handlePrevPage}
                disabled={!hasPrevPage}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-slate-400 text-sm px-4">
                Page {page + 1}
              </span>
              <Button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
