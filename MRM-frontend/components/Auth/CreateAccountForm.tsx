import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

const CreateAccountForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating account:", formData);
    // API call to create account
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
        label="Email"
        name="email"
        value={formData.email}
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
