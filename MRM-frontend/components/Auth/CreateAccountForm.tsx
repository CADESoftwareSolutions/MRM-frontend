import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus } from "lucide-react";

const CreateAccountForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Account created successfully!", data);
        router.push("/Dashboard");
      } else {
        setError(data.message || "Unable to create account.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <UserPlus className="h-6 w-6 text-purple-600" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
          Create Account
        </CardTitle>
        <p className="text-sm text-gray-500">
          Sign up to get started with your account
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-sm font-medium text-gray-700"
            >
              Username
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleInputChange}
              required
              autoFocus
              className="border-gray-300 bg-white focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="border-gray-300 bg-white focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-sm text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg transition-all hover:from-purple-700 hover:to-purple-800 hover:shadow-xl"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          {/* Sign In Link */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{" "}
            </span>
            <Link
              href="/Login/Login"
              className="text-sm font-medium text-purple-600 transition-colors hover:text-purple-700 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateAccountForm;
