import React from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout/Layout";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import {
  Box,
  Card,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { ourFeatures } from "../../components/HomePage/AboutUs/AboutUs";

const dummyItems = [
  "Lorem ipsum dolor sit amet",
  "Consectetur adipiscing elit",
  "Integer molestie lorem at massa",
];

const ServicePage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;

  if (!slug) return null;

  const service = ourFeatures.find((f) => f.slug === slug);

  return (
    <Layout>
      <Box
        sx={{
          minHeight: "calc(100vh - 120px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom right, #f5f6fa, #f0f4ff)",
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          p: { xs: 2, md: 6 },
        }}
      >
        <Card
          elevation={5}
          sx={{
            borderRadius: 4,
            p: { xs: 3, md: 5 },
            width: "100%",
            maxWidth: 1100,
            height: 600,
            backgroundColor: "#ffffff",
            boxShadow:
              "0 10px 30px rgba(99, 102, 241, 0.25), 0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: "#1e1e1e",
                letterSpacing: 0.5,
              }}
            >
              {service?.title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#555",
                fontSize: "1.05rem",
              }}
            >
              {service?.description}
            </Typography>
          </Box>

          <Grid
            container
            spacing={4}
            alignItems="center"
            justifyContent="center"
          >
            <Grid component="div" size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  overflow: "hidden",
                  borderRadius: 3,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  transition: "transform 0.4s ease",
                  "&:hover": { transform: "scale(1.02)" },
                }}
              >
                <Image
                  src={service!.image}
                  alt={service!.title}
                  width={600}
                  height={400}
                  style={{
                    width: "100%",
                    objectFit: "cover",
                    display: "block",
                    aspectRatio: "1/1",
                  }}
                />
              </Box>
            </Grid>

            <Grid component="div" size={{ xs: 12, md: 6 }}>
              <List>
                {dummyItems.map((item, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      py: 1.5,
                      px: 1,
                      borderRadius: 2,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <WaterDropIcon
                        sx={{
                          color: "#22c55e",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </Card>
      </Box>
    </Layout>
  );
};

export default ServicePage;
