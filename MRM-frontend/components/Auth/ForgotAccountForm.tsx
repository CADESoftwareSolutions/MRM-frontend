import React, { useState } from "react";
import { Box, TextField, Button, Typography, Card } from "@mui/material";
import Link from "next/link";

const ForgotAccountForm: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Request password reset for:", email);
    // API call for forgot password
  };

  return (
    <Card sx={{ p: 2 }} elevation={2}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Forgot Password / Username
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Please enter your email to search for your account.
        </Typography>
        <TextField
          margin="normal"
          required
          fullWidth
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Box display="flex" gap={2}>
          <Button
            component={Link}
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            href="/Login/Login"
            color="secondary"
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
            Submit
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default ForgotAccountForm;
