import { Box, Grid, Typography } from "@mui/material";
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

const IntroSection = () => (
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
      Designed for oil, gas, and mineral rights management — modern, reliable,
      and built for growth.
    </Typography>

    {/* Hero Cards */}
    <Grid container spacing={4} justifyContent="center">
      {homeImages.map((feature, index) => (
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
              height: index === 1 || index === 2 ? 340 : 320,
              width: 200,
              transform: index === 1 || index === 2 ? "scale(0.9)" : "scale(1)",
              borderRadius: "50% / 30%",
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <Image
              src={feature.image}
              alt={feature.title}
              layout="fill" // fill the container
              objectFit="cover"
              style={{
                borderRadius: "50% / 30%",
              }}
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
);

export default IntroSection;
