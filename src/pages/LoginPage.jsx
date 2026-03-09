/**
 * ======================================================
 * LoginPage.jsx
 * Modern Firebase Login UI
 * Greenwood Shuttlers
 *
 * Features
 * ✔ Modern mobile friendly UI
 * ✔ Firebase authentication
 * ✔ Forgot password
 * ✔ Loading state
 * ✔ Clear error messages
 * ✔ Auto redirect after login
 * ✔ Secure login footer
 * ======================================================
 */

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
  CircularProgress,
} from "@mui/material";

export default function LoginPage() {

  const { login, user } = useAuth();
  const navigate = useNavigate();

  /* ============================================
     STATE
  ============================================ */

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  /* ============================================
     REDIRECT IF USER ALREADY LOGGED IN
  ============================================ */

  useEffect(() => {

    if (user) {
      navigate("/dashboard");
    }

  }, [user, navigate]);


  /* ============================================
     LOGIN HANDLER
  ============================================ */

  const handleSubmit = async (e) => {

    e.preventDefault();
    setError("");
    setLoading(true);

    try {

      await login(email, password);

    } catch (err) {

      /**
       * Firebase error handling
       */

      if (err.code === "auth/user-not-found") {
        setError("User not found");
      }
      else if (err.code === "auth/wrong-password") {
        setError("Incorrect password");
      }
      else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Try later.");
      }
      else {
        setError("Login failed");
      }

    }

    setLoading(false);

  };


  /* ============================================
     FORGOT PASSWORD
  ============================================ */

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


  /* ============================================
     UI
  ============================================ */

  return (

    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        /* modern gradient background */
        background:
          "linear-gradient(135deg,#1e3c72,#2a5298)",
        padding: 2,
      }}
    >

      <Card
        sx={{
          width: 360,
          borderRadius: 4,
          boxShadow: 6,
        }}
      >

        <CardContent>

          {/* APP TITLE */}

          <Typography
            variant="h5"
            textAlign="center"
            fontWeight="bold"
            mb={1}
          >
            🏸 Greenwood Shuttlers
          </Typography>

          <Typography
            textAlign="center"
            fontSize={14}
            color="text.secondary"
            mb={3}
          >
            Member Login
          </Typography>


          {/* LOGIN FORM */}

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

            {/* ERROR MESSAGE */}

            {error && (

              <Typography
                color="error"
                fontSize={14}
                mt={1}
              >
                {error}
              </Typography>

            )}


            {/* LOGIN BUTTON */}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                py: 1.2,
                borderRadius: 2,
                fontWeight: "bold",
              }}
              disabled={loading}
            >

              {loading
                ? <CircularProgress size={22} color="inherit"/>
                : "Login"}

            </Button>


            {/* FORGOT PASSWORD */}

            <Button
              variant="text"
              size="small"
              onClick={handleForgotPassword}
              sx={{ mt: 1 }}
              fullWidth
            >
              Forgot password?
            </Button>

          </form>


          {/* FOOTER */}

          <Typography
            textAlign="center"
            fontSize={12}
            color="text.secondary"
            mt={3}
          >
            Secure login powered by Firebase 🔐
          </Typography>

        </CardContent>

      </Card>

    </Box>

  );

}