import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";

const ForgotAccountForm: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Request password reset for:", email);
    // API call for forgot password
  };

  return (
    <Card
      className="border-purple-200/50 bg-white/95 shadow-2xl backdrop-blur-sm"
      style={{
        boxShadow: "0 20px 60px rgba(139, 92, 246, 0.3)",
      }}
    >
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
          <KeyRound className="h-6 w-6 text-purple-600" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
          Account Recovery
        </CardTitle>
        <p className="text-sm text-gray-500">
          Enter your email address and we'll help you recover your account
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="border-gray-300 bg-white focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-3">
            <Link href="/Login/Login" className="w-full">
              <Button
                type="button"
                variant="outline"
                className="w-40 border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className=" bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg transition-all hover:from-purple-700 hover:to-purple-800 hover:shadow-xl"
            >
              Send Reset Link
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/Login/Login"
              className="text-sm font-medium text-purple-600 transition-colors hover:text-purple-700 hover:underline"
            >
              ← Back to Sign In
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ForgotAccountForm;
