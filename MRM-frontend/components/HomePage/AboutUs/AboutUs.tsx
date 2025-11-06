import {
  Box,
  Button,
  Card,
  CardMedia,
  Grid,
  Typography,
  Paper,
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import WaterDropIcon from "@mui/icons-material/WaterDrop";

export const ourFeatures = [
  {
    title: "Accounting Management",
    description:
      "Revenue, JIB and AFE management with the ability to drill down into revenue check details to ensure accurate payment of decimal interests, production months and product types",
    image: "/images/HomePage/revenueManagement.jpg",

    active: true,
    path: "/pages/Services/TaxManagement",
    slug: "accounting-management",
  },
  {
    title: "Deed, Lease and Surface Management",
    description:
      "Provide a comprehensive view of deeds, leases and surface ownership",
    image: "/images/HomePage/deed.jpg",
    active: false,
    path: "/pages/Services/TaxManagement",
    slug: "deed-lease-surface-management",
  },
  {
    title: "Well and Division Order Management",
    description:
      "Take control of your assets, track ownership, monitor well performance and confirm your decimal interest with the built-in calculator",
    image: "/images/HomePage/wellAndDivision.png",
    active: true,
    path: "/pages/Services/TaxManagement",
    slug: "well-division-order-management",
  },
  {
    title: "Acquisition/Divestiture/Operator Management",
    description:
      "Track changes in property ownership, operators and purchasers through a single, integrated system",
    image: "/images/HomePage/oil-management.jpg",
    active: false,
    path: "/pages/Services/TaxManagement",
    slug: "acquisition-divestiture-management",
  },
  {
    title: "Document Management/PDF Conversion",
    description:
      "Securely store documents and convert revenue check details to excel for easy analysis",
    image: "/images/HomePage/pdf.jpg",
    active: false,
    path: "/pages/Services/TaxManagement",
    slug: "document-management",
  },
  {
    title: "Tax Management",
    description:
      "Streamline Ad Valorem tax analysis and year-end tax reporting",
    image: "/images/HomePage/taxes.jpg",
    active: false,
    path: "/pages/Services/TaxManagement",
    slug: "tax-management",
  },
  {
    title: "Reports Management",
    description:
      "Access to a variety of reports, including the ability to create custom reports at the click of a button",
    image: "/images/HomePage/homePageImage4.jpg",
    active: false,
    path: "/pages/Services/TaxManagement",
    slug: "reports-management",
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
      <Grid container spacing={2} alignItems="center" sx={{ mb: 12 }}>
        <Grid>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Who we are
          </Typography>
          <Typography sx={{ mb: 2, color: "text.secondary" }}>
            At CADE Solutions, we simplify the complex world of mineral
            management. Backed by over 95 years of combined experience in oil,
            gas and software development, our team is committed in delivering
            quality and proven results. Our platform streamlines revenue
            tracking, as well as lease, surface and document management so you
            can focus on what matters most.
          </Typography>
          <Typography sx={{ mb: 2, color: "text.secondary" }}>
            <WaterDropIcon /> CADE brings clarity and makes the process
            straightforward.
          </Typography>
          <Typography sx={{ mb: 2, color: "text.secondary" }}>
            <WaterDropIcon /> CADE delivers trusted, accurate results.
          </Typography>
          <Typography sx={{ mb: 2, color: "text.secondary" }}>
            <WaterDropIcon /> CADE simplifies the process of managing your
            minerals.
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

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
          }}
        >
          <Box
            component="div"
            sx={{
              width: { xs: "100%", md: "40%" },
              flexShrink: 0,
            }}
          >
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
                  "&:hover": { boxShadow: 4 },
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
              </Paper>
            ))}
          </Box>

          <Box
            component="div"
            sx={{
              width: { xs: "100%", md: "66.6666%", lg: "33%" },
              flexGrow: 1,
            }}
          >
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

                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: 350,
                      borderRadius: 3,
                      overflow: "hidden",
                      backgroundColor: "#f9fafb",
                      mb: 3,
                    }}
                  >
                    <Image
                      src={activeFeature.image}
                      alt={activeFeature.title}
                      fill={true}
                    />
                  </Box>

                  <Typography sx={{ color: "text.secondary", mb: 1 }}>
                    {activeFeature.description}
                  </Typography>
                </Paper>
              ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AboutUs;
