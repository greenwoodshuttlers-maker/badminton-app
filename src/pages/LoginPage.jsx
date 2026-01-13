import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";

import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent to your email");
    } catch (err) {
      alert(err.message);
    }
  };


  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const success = await login(email, password);
    if (!success) {
      setError("Invalid credentials or inactive user");
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f4f6f8"
    >
      <Card sx={{ width: 360, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" mb={2}>
            🏸 Greenwood Shuttlers
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <Typography color="error" fontSize={14} mt={1}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2, py: 1.2, borderRadius: 2 }}
            >
              Login
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={handleForgotPassword}
              sx={{ mt: 1 }}
            >
              Forgot password?
            </Button>

          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
