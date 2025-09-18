import React from "react";
import Layout from "../../components/Layout/Layout";

import {
  Box,
  Grid,
  Typography,
  Container,
  Card,
  CardContent,
} from "@mui/material";
import Image from "next/image";
import { ourFeatures } from "../../components/HomePage/AboutUs/AboutUs";

const Services = () => (
  <Layout>
    <Box
      sx={{
        background:
          "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
        color: "#fff",
        py: 8,
      }}
    >
      <Box
        sx={{
          textAlign: "center",
          mb: 8,
        }}
      ></Box>

      <Container maxWidth="lg">
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 6 }}
        >
          Services
        </Typography>

        {ourFeatures.map((service, index) => (
          <Grid
            container
            spacing={6}
            alignItems="center"
            justifyContent="center"
            key={service.title}
            sx={{ mb: 8 }}
            direction={index % 2 === 0 ? "row" : "row-reverse"}
          >
            <Grid component={"div"} size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 4,
                  overflow: "hidden",
                  boxShadow: 3,
                }}
              >
                <Image
                  src={service.image}
                  alt={service.title}
                  width={500}
                  height={300}
                  style={{ objectFit: "cover", width: "100%", height: "auto" }}
                />
              </Card>
            </Grid>

            <Grid component={"div"} size={{ xs: 12, md: 7 }}>
              <Card
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.84)",
                  borderRadius: 4,
                  p: 4,
                  boxShadow: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {service.title}
                  </Typography>
                  <Typography variant="body1">{service.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ))}
      </Container>
    </Box>
  </Layout>
);

export default Services;
