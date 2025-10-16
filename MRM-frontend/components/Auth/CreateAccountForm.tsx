import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useRouter } from "next/router";

const CreateAccountForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/signup", {
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
    }
  };

  return (
    <Box component="form" onSubmit={handleCreateAccount} sx={{ mt: 1 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Create Account
      </Typography>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Username"
        name="username"
        value={formData.username}
        onChange={handleInputChange}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        type="password"
        label="Password"
        name="password"
        value={formData.password}
        onChange={handleInputChange}
      />
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
        Create Account
      </Button>
    </Box>
  );
};

export default CreateAccountForm;
