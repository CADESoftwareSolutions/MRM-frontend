import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  TextField,
  Button,
  Grid,
  Link,
  Divider,
  Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

interface FormData {
  username: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful!", data);
        router.push("/Dashboard");
      } else {
        setError(data.message || "Invalid username or password.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Sign In
      </Typography>

      <Button
        fullWidth
        variant="contained"
        startIcon={<GoogleIcon />}
        sx={{ mb: 2, bgcolor: "#4285F4", "&:hover": { bgcolor: "#357ae8" } }}
        onClick={() => alert("Google login")}
      >
        Sign in with Google
      </Button>

      <Divider sx={{ my: 2 }}>OR</Divider>

      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="Username"
        name="username"
        autoFocus
        value={formData.username}
        onChange={handleInputChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        type="password"
        id="password"
        name="password"
        label="Password"
        value={formData.password}
        onChange={handleInputChange}
      />

      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      <Grid container justifyContent="flex-end" sx={{ mt: 1 }}>
        <Grid>
          <Link href="/Login/ForgotAccount" variant="body2">
            Forgot password or username?
          </Link>
        </Grid>
      </Grid>

      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
        {loading ? "Logging in..." : "Login"}
      </Button>

      <Grid container justifyContent="center">
        <Grid>
          <Link href="/Login/CreateAccount" variant="body2">
            {"Don't have an account? Create Account"}
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoginForm;
