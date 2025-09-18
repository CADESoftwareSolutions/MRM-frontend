import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
} from "@mui/material";
import Layout from "../../components/Layout/Layout";

const ContactUs = () => {
  return (
    <Layout>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
          py: 10,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid component={"div"} size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: "#fff",
                  mb: 3,
                }}
              >
                Get in Touch
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: "#d1c4e9",
                  mb: 2,
                }}
              >
                We’d love to hear from you! Whether you have a question,
                feedback, or just want to say hello, our team is here.
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: "#fff",
                  fontWeight: 500,
                  mb: 1,
                }}
              >
                📧 Email:{" "}
                <Box
                  component="span"
                  sx={{ color: "#e91e63", fontWeight: 600 }}
                >
                  support@pathway.com
                </Box>
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: "#fff",
                  fontWeight: 500,
                }}
              >
                📞 Phone:{" "}
                <Box
                  component="span"
                  sx={{ color: "#e91e63", fontWeight: 600 }}
                >
                  (555) 123-4567
                </Box>
              </Typography>
            </Grid>

            <Grid component={"div"} size={{ xs: 12, md: 6 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  boxShadow: "0px 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                <CardMedia
                  component="img"
                  image="/images/ContactUs/ContactUs.png"
                  alt="Contact Us"
                  sx={{ height: 400, objectFit: "cover" }}
                />
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Layout>
  );
};

export default ContactUs;
