import { Container, Box, CssBaseline } from "@mui/material";
import ForgotAccountForm from "../../../components/Auth/ForgotAccountForm";

const ForgotAccountPage = () => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background:
        "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
      p: 2,
    }}
  >
    <CssBaseline />
    <Container maxWidth="xs">
      <ForgotAccountForm />
    </Container>
  </Box>
);

export default ForgotAccountPage;
