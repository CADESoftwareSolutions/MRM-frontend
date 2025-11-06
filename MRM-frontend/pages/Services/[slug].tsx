import React from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout/Layout";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import {
  Box,
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

  if (!service)
    return (
      <Layout>
        <Typography variant="h4">Service Not Found</Typography>
      </Layout>
    );

  return (
    <Layout>
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          flexGrow: 1,
          p: { xs: 2, md: 6 },
          background:
            "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700 }} gutterBottom>
            {service.title}
          </Typography>
          <Typography variant="body1" sx={{ color: "#d1d5db" }}>
            {service.description}
          </Typography>
        </Box>

        <Grid
          container
          spacing={2}
          alignItems="flex-start"
          justifyContent="center"
        >
          <Grid component={"div"} sx={{ mb: { xs: 2, md: 0 } }}>
            <Image
              src={service.image}
              alt={service.title}
              width={600}
              height={400}
              style={{ borderRadius: 8 }}
            />
          </Grid>
          <Grid
            component={"div"}
            sx={{
              xs: 12,
              md: 6,
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <List sx={{ pt: 0 }}>
              {dummyItems.map((item, idx) => (
                <ListItem key={idx} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <WaterDropIcon sx={{ color: "#22c55e" }} />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default ServicePage;
