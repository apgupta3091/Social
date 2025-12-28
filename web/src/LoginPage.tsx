import { useState } from "react";
import { API_URL } from "./App";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const redirect = useNavigate();
  const [, setCookie] = useCookies(["at"]);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/authentication/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const out = await response.json();
      setCookie("at", out.data);
      redirect("/");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-3xl">🐿️</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Social
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email</label>
            <Input
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20"
            />
          </div>
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-500/25"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-slate-400">
            New here?{" "}
            <a
              href="/register"
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Create an account
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
