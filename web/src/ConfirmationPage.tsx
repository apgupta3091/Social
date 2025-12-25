import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "./App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

export const ConfirmationPage = () => {
  const { token = "" } = useParams();
  const redirect = useNavigate();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleConfirm = async () => {
    setStatus("loading");
    try {
      const response = await fetch(`${API_URL}/users/activate/${token}`, {
        method: "PUT",
      });

      if (response.ok) {
        setStatus("success");
        setTimeout(() => redirect("/login"), 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "success" ? (
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            ) : status === "error" ? (
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-3xl">✉️</span>
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {status === "success"
              ? "Email Confirmed!"
              : status === "error"
              ? "Confirmation Failed"
              : "Confirm Your Email"}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {status === "success"
              ? "Your account has been activated. Redirecting to login..."
              : status === "error"
              ? "The confirmation link may have expired or is invalid."
              : "Click the button below to verify your email address."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "idle" && (
            <Button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium shadow-lg shadow-cyan-500/25"
            >
              Confirm Email
            </Button>
          )}
          {status === "loading" && (
            <Button disabled className="w-full">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Confirming...
            </Button>
          )}
          {status === "error" && (
            <Button
              onClick={() => redirect("/login")}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
