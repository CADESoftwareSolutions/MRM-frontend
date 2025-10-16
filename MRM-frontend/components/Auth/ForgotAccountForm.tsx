import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

const ForgotAccountForm: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Request password reset for:", email);
    // API call for forgot password
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Forgot Password / Username
      </Typography>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
        Submit
      </Button>
    </Box>
  );
};

export default ForgotAccountForm;
