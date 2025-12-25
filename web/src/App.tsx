import useSWR, { mutate } from "swr";
import { FeedPost, Post } from "./Post";
import { useCookies } from "react-cookie";
import { Navigate, useNavigate } from "react-router-dom";
import { CreatePostForm } from "./CreatePostForm";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/v1";

export const fetcher = (at: string) => (url: string) =>
  fetch(API_URL + url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${at}`,
    },
  }).then((r) => r.json());

function App() {
  const [cookies, setCookie] = useCookies(["at"]);
  const at = cookies.at;
  const redirect = useNavigate();

  const { data, error, isLoading } = useSWR<{ data: FeedPost[] }>(
    "/users/feed",
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
    mutate("/users/feed");
  };

  const handleClickPost = (id: number) => () => redirect(`/post/${id}`);

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
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
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
            />
          ))}

          {data?.data?.length === 0 && (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400">No posts yet.</p>
              <p className="text-slate-500 text-sm mt-1">
                Follow someone or create your first post!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
