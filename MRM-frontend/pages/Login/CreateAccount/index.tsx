import { Container, Box } from "@mui/material";
import CreateAccountForm from "../../../components/Auth/CreateAccountForm";

const CreateAccountPage = () => (
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
      <CreateAccountForm />
    </Container>
  </Box>
);

export default CreateAccountPage;
