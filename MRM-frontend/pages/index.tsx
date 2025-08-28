import {
  Box,
  Typography,
  Grid,
  Button,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import Layout from "../components/Layout/Layout";
import Image from "next/image";

const homeImages = [
  {
    title: "Payment Management",
    image: "/images/homePage/homePageImage1.png",
    offset: "-20px",
  },
  {
    title: "Document Handling",
    image: "/images/homePage/homePageImage2.png",
    offset: "20px",
  },
  {
    title: "Landowner Communication",
    image: "/images/homePage/homePageImage3.png",
    offset: "20px",
  },
  {
    title: "Reporting & Compliance",
    image: "/images/homePage/homePageImage4.png",
    offset: "-20px",
  },
];

const Home = () => {
  return (
    <Layout>
      {/* ===================== Hero Section ===================== */}
      <Box
        sx={{
          minHeight: "90vh",
          background:
            "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 2,
        }}
      >
        <Typography variant="h2" sx={{ fontWeight: 700, mb: 2 }}>
          Smarter Solutions For{" "}
          <Box component="span" sx={{ color: "#e91e63" }}>
            Landowner{" "}
          </Box>
          Relations
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4, maxWidth: 600 }}>
          Designed for oil, gas, and mineral rights management — modern,
          reliable, and built for growth.
        </Typography>

        {/* Hero Cards */}
        <Grid container spacing={4} justifyContent="center">
          {homeImages.map((feature) => (
            <Grid
              key={feature.title}
              sx={{
                transform: `translateY(${feature.offset})`,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: 200,
                  height: 280,
                  borderRadius: "30%",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
              >
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  style={{ objectFit: "cover" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    {feature.title}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ===================== Who We Are Section ===================== */}
      <Box sx={{ py: 10, px: 2, backgroundColor: "#f8f8f8" }}>
        <Grid container spacing={4} alignItems="center">
          <Grid component="div">
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
              Who We Are
            </Typography>
            <Typography sx={{ mb: 2 }}>
              The need for energy is universal. That's why ExxonMobil scientists
              and engineers are pioneering new research and pursuing new
              technologies to reduce emissions while creating more efficient
              fuels.
            </Typography>
            <Typography sx={{ mb: 3 }}>
              Helping reduce emissions by providing solutions to our industrial
              and commercial customers in growing markets for carbon capture and
              storage, hydrogen and biofuels.
            </Typography>
            <Button variant="contained" color="success">
              Check Details
            </Button>
          </Grid>
          <Grid component="div">
            <Grid container spacing={2}>
              {[
                "/images/team1.jpg",
                "/images/team2.jpg",
                "/images/team3.jpg",
                "/images/team4.jpg",
              ].map((img, index) => (
                <Grid component="div" key={index}>
                  <Card>
                    <CardMedia
                      component="img"
                      image={img}
                      alt={`Team ${index + 1}`}
                    />
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* ===================== Additional Sections Placeholder ===================== */}
      {/* You can add more sections like Product, Pricing, Help here */}
    </Layout>
  );
};

export default Home;
