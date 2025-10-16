import { Container, Box } from "@mui/material";
import LoginForm from "../../../components/Auth/LoginForm";

const LoginPage = () => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "#f0f2f5",
      p: 2,
    }}
  >
    <Container maxWidth="xs">
      <LoginForm />
    </Container>
  </Box>
);

export default LoginPage;
