import { Container, Box } from "@mui/material";
import ForgotAccountForm from "../../../components/Auth/ForgotAccountForm";

const ForgotAccountPage = () => (
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
      <ForgotAccountForm />
    </Container>
  </Box>
);

export default ForgotAccountPage;
