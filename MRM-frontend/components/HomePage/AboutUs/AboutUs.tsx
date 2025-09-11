import {
  Box,
  Button,
  Card,
  CardMedia,
  Grid,
  Typography,
  Paper,
} from "@mui/material";

const ourFeatures = [
  {
    title: "Revenue Payment Management",
    description:
      "Analyzed to ensure correct decimal interest, production months, and product types are paid accurately.",
    image: "/images/HomePage/revenueManagement.jpg",
    active: true,
  },
  {
    title: "Well and Division Order Management",
    description:
      "Know what you own, what is producing, and use the built-in calculator to confirm your interest.",
    image: "/images/features/well-management.png",
    active: false,
  },
  {
    title: "Deed, Lease, and Surface Management",
    description:
      "Centralized tracking to give you a complete understanding of your deed, lease, and surface ownership details.",
    image: "/images/features/deed-management.png",
    active: false,
  },
  {
    title: "Acquisition/Divestiture/Operator Management",
    description:
      "Track all changes to ownership, operators, and property statuses efficiently through a unified system.",
    image: "/images/features/acquisition-management.png",
    active: false,
  },
  {
    title: "Accounting Management",
    description:
      "Analyzed to ensure all revenue, Joint Interest Billings (JIBs), and Authorizations for Expenditure (AFEs) are managed effectively.",
    image: "/images/features/accounting-management.png",
    active: false,
  },
  {
    title: "Tax Management",
    description:
      "Simplify ad valorem taxes, income taxes, depletion, and cost calculations for accurate financial reporting.",
    image: "/images/features/tax-management.png",
    active: false,
  },
  {
    title: "Document Management/PDF Conversion",
    description:
      "Documents are safely stored, organized, and check details are quickly converted to Excel spreadsheets for easy analysis.",
    image: "/images/features/document-management.png",
    active: false,
  },
  {
    title: "Reports Management",
    description:
      "Access a variety of canned reports and create custom reports to quickly see everything at your fingertips.",
    image: "/images/features/reports-management.png",
    active: false,
  },
];

const AboutUs = () => (
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
          At Pathway, we make it easier for landowners and businesses to manage
          the complex world of mineral management. Our platform streamlines the
          way you handle revenue, leasing, surface, and documents so you can
          focus on what matters most.
        </Typography>
        <Typography sx={{ mb: 3, color: "text.secondary" }}>
          Whether it's tracking revenue, leases, or surface ownership, we are
          here to simplify the process and give you absolute clarity and trust
          in the properties you own.
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
        Take control of your rights
      </Typography>
      <Grid container spacing={4}>
        {/* Left side categories */}
        <Grid component={"div"} size={{ xs: 12, md: 4 }}>
          {ourFeatures.map((feature) => (
            <Paper
              key={feature.title}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                border: feature.active
                  ? "2px solid #22c55e"
                  : "1px solid #e5e7eb",
                backgroundColor: feature.active ? "#f0fdf4" : "white",
                cursor: "pointer",
                "&:hover": { boxShadow: 2 },
              }}
            >
              <Typography sx={{ fontWeight: 600 }}>{feature.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Paper>
          ))}
        </Grid>

        <Grid component={"div"} size={{ xs: 12, md: 8 }}>
          {ourFeatures
            .filter((f) => f.active)
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
                    sx={{ width: "100%", height: 500, objectFit: "fill" }}
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

export default AboutUs;
