import {
  Box,
  Button,
  Card,
  CardMedia,
  Grid,
  Typography,
  Paper,
} from "@mui/material";
import { useState } from "react";

export const ourFeatures = [
  {
    title: "Accounting Management",
    description:
      "Revenue, JIB and AFE management with the ability to drill down into revenue check details to ensure accurate payment of decimal interests, production months and product types",
    image: "/images/HomePage/revenueManagement.jpg",

    active: true,
  },
  {
    title: "Deed, Lease and Surface Management",
    description:
      "Provide a comprehensive view of deeds, leases and surface ownership",
    image: "/images/features/well-management.png",
    active: false,
  },
  {
    title: "Well and Division Order Management",
    description:
      "Take control of your assets, track ownership, monitor well performance and confirm your decimal interest with the built-in calculator",
    image: "/images/features/deed-management.png",
    active: false,
  },
  {
    title: "Acquisition/Divestiture/Operator Management",
    description:
      "Track changes in property ownership, operators and purchasers through a single, integrated system",
    image: "/images/features/acquisition-management.png",
    active: false,
  },
  {
    title: "Document Management/PDF Conversion",
    description:
      "Securely store documents and convert revenue check details to excel for easy analysis",
    image: "/images/features/document-management.png",
    active: false,
  },
  {
    title: "Tax Management",
    description:
      "Streamline Ad Valorem tax analysis and year-end tax reporting",
    image: "/images/features/tax-management.png",
    active: false,
  },
  {
    title: "Reports Management",
    description:
      "Access to a variety of reports, including the ability to create custom reports at the click of a button",
    image: "/images/features/reports-management.png",
    active: false,
  },
];

const AboutUs = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <Box
      sx={{
        py: 10,
        px: { xs: 2, md: 8 },
        background: "linear-gradient(to bottom right, #ffffff, #f3e8ff)",
      }}
    >
      <Grid container spacing={6} alignItems="center" sx={{ mb: 12 }}>
        <Grid component={"div"} size={{ xs: 12, md: 6 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Who we are
          </Typography>
          <Typography sx={{ mb: 2, color: "text.secondary" }}>
            At Cade Software Solutions, we simplify the complex world of mineral
            management. Backed by over 95 years of combined experience in oil,
            gas and software development, our team is committed in delivering
            quality and proven results. Our platform streamlines revenue
            tracking, as well as lease, surface and document management so you
            can focus on what matters most.
          </Typography>
          <Typography sx={{ mb: 3, color: "text.secondary" }}>
            Cade makes the process clear and straightforward and brings clarity,
            trust and simplifies the process.
          </Typography>
        </Grid>

        <Grid component={"div"} size={{ xs: 12, md: 6 }}>
          <Grid container spacing={2}>
            {[
              "/images/HomePage/1.png",
              "/images/HomePage/2.jpg",
              "/images/HomePage/3.jpg",
              "/images/HomePage/4.jpg",
            ].map((img, index) => (
              <Grid
                component={"div"}
                size={{ xs: 6 }}
                key={index}
                sx={{
                  mt: index % 2 === 1 ? 4 : 0,
                }}
              >
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={img}
                    alt={`Team ${index + 1}`}
                    sx={{ width: "100%", height: 220, objectFit: "cover" }}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          What we do
        </Typography>
        <Typography
          sx={{ fontWeight: 600, color: "error.main", mb: 2 }}
          variant="subtitle1"
        >
          Take control of your Assets
        </Typography>
        <Grid container spacing={4}>
          <Grid component={"div"} size={{ xs: 12, md: 4 }}>
            {ourFeatures.map((feature, index) => (
              <Paper
                key={feature.title}
                onClick={() => setActiveIndex(index)}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border:
                    index === activeIndex
                      ? "2px solid #22c55e"
                      : "1px solid #e5e7eb",
                  backgroundColor: index === activeIndex ? "#f0fdf4" : "white",
                  cursor: "pointer",
                  "&:hover": { boxShadow: 2 },
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
              </Paper>
            ))}
          </Grid>

          <Grid component={"div"} size={{ xs: 12, md: 8 }}>
            {ourFeatures
              .filter((f, index) => index === activeIndex)
              .map((activeFeature) => (
                <Paper
                  key={activeFeature.title}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    {activeFeature.title}
                  </Typography>
                  <Card
                    sx={{
                      borderRadius: 2,
                      overflow: "hidden",
                      mb: 2,
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={activeFeature.image}
                      alt={activeFeature.title}
                      sx={{ width: "100%", height: 360, objectFit: "fill" }}
                    />
                  </Card>
                  <Typography sx={{ color: "text.secondary", mb: 1 }}>
                    {activeFeature.description}
                  </Typography>
                </Paper>
              ))}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AboutUs;
