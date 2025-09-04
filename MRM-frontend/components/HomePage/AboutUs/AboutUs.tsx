import {
  Box,
  Button,
  Card,
  CardMedia,
  Grid,
  Typography,
  Paper,
} from "@mui/material";

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
          the complex world of oil, gas, and mineral rights. Our platform
          streamlines the way you handle payments, documents, and communication,
          so you can focus on what matters most.
        </Typography>
        <Typography sx={{ mb: 3, color: "text.secondary" }}>
          Whether it’s tracking revenue, organizing agreements, or staying
          compliant, we’re here to simplify the process and give you clarity and
          control.
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
          {[
            { title: "Exploration and Production", active: true },
            { title: "Refining and Processing" },
            { title: "Transportation and Distribution" },
            { title: "Marketing and Sales" },
            { title: "Research and Development" },
          ].map((item, idx) => (
            <Paper
              key={idx}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                border: item.active ? "2px solid #22c55e" : "1px solid #e5e7eb",
                backgroundColor: item.active ? "#f0fdf4" : "white",
                cursor: "pointer",
                "&:hover": { boxShadow: 2 },
              }}
            >
              <Typography sx={{ fontWeight: 600 }}>{item.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                Short description goes here...
              </Typography>
            </Paper>
          ))}
        </Grid>

        {/* Right side main card */}
        <Grid component={"div"} size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Exploration and Production
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
                image="/images/oilrig.png"
                alt="Exploration and Production"
                sx={{ width: "100%", height: 250, objectFit: "cover" }}
              />
            </Card>
            <Typography sx={{ color: "text.secondary", mb: 1 }}>
              The need for energy is universal. That's why ExxonMobil scientists
              and engineers are pioneering new research and pursuing new
              technologies to reduce emissions while creating more efficient
              fuels.
            </Typography>
            <Button variant="text" color="error">
              Start a free trial →
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  </Box>
);

export default AboutUs;
