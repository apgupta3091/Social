import useSWR, { mutate } from "swr";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { fetcher, API_URL } from "./App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  UserPlus,
  UserMinus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface UserWithFollowStatus {
  id: number;
  username: string;
  created_at: string;
  is_followed: boolean;
}

const USERS_PER_PAGE = 10;

export const UsersPage = () => {
  const [cookies] = useCookies(["at"]);
  const at = cookies.at;
  const redirect = useNavigate();
  const [page, setPage] = useState(0);
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);

  const offset = page * USERS_PER_PAGE;
  const usersUrl = `/users?limit=${USERS_PER_PAGE}&offset=${offset}`;

  const { data, error, isLoading } = useSWR<{ data: UserWithFollowStatus[] }>(
    usersUrl,
    at ? fetcher(at) : null
  );

  if (!at) {
    return <Navigate to="/login" replace />;
  }

  const handleFollow = async (userId: number) => {
    setLoadingUserId(userId);
    try {
      await fetch(`${API_URL}/users/${userId}/follow`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${at}`,
        },
      });
      mutate(usersUrl);
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleUnfollow = async (userId: number) => {
    setLoadingUserId(userId);
    try {
      await fetch(`${API_URL}/users/${userId}/unfollow`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${at}`,
        },
      });
      mutate(usersUrl);
    } finally {
      setLoadingUserId(null);
    }
  };

  const handlePrevPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (data?.data?.length === USERS_PER_PAGE) {
      setPage(page + 1);
    }
  };

  const hasNextPage = data?.data?.length === USERS_PER_PAGE;
  const hasPrevPage = page > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            onClick={() => redirect("/")}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Discover Users</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-slate-400">
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              Loading users...
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">
              Failed to load users. Please try again.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {data?.data?.map((user) => (
            <Card
              key={user.id}
              className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors"
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {user.username}
                      </p>
                      <p className="text-sm text-slate-400">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      user.is_followed
                        ? handleUnfollow(user.id)
                        : handleFollow(user.id)
                    }
                    disabled={loadingUserId === user.id}
                    variant={user.is_followed ? "outline" : "default"}
                    size="sm"
                    className={
                      user.is_followed
                        ? "border-slate-600 text-slate-300 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                    }
                  >
                    {loadingUserId === user.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : user.is_followed ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-1" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Follow
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {data?.data?.length === 0 && (
          <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
            <p className="text-slate-400">No users found.</p>
          </div>
        )}

        {/* Pagination */}
        {data?.data && data.data.length > 0 && (
          <div className="flex items-center justify-center gap-4 pt-6">
            <Button
              onClick={handlePrevPage}
              disabled={!hasPrevPage}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-slate-400 text-sm px-4">Page {page + 1}</span>
            <Button
              onClick={handleNextPage}
              disabled={!hasNextPage}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white disabled:opacity-50"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};
