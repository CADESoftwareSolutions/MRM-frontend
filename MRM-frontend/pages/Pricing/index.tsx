import React from "react";
import Layout from "../../components/Layout/Layout";

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

const tiers = [
  {
    name: "Starter",
    price: "$29",
    frequency: "/month",
    description: "Perfect for individuals or small teams just getting started.",
    features: [
      "Basic account management",
      "Email support",
      "Access to standard tools",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$79",
    frequency: "/month",
    description: "For growing businesses that need more advanced features.",
    features: [
      "Everything in Starter",
      "Advanced analytics",
      "Priority support",
      "Team collaboration tools",
    ],
    highlighted: true,
  },
];

const Pricing = () => {
  return (
    <Layout>
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 8,
          px: 2,
        }}
      >
        <Box textAlign="center" mb={6} maxWidth="600px">
          <Typography variant="h3" fontWeight={700} color="white" gutterBottom>
            Our Pricing
          </Typography>
          <Typography variant="h6" color="rgba(255,255,255,0.8)">
            Choose the plan that works best for your business. Upgrade anytime
            as you grow.
          </Typography>
        </Box>

        <Grid container spacing={4} justifyContent="center" maxWidth="lg">
          {tiers.map((tier) => (
            <Grid component={"div"} size={{ xs: 12, md: 6 }} key={tier.name}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  textAlign: "center",
                  backgroundColor: tier.highlighted
                    ? "white"
                    : "rgba(255,255,255,0.08)",
                  color: tier.highlighted ? "text.primary" : "white",
                  border: tier.highlighted ? "3px solid #9c27b0" : "none",
                  boxShadow: tier.highlighted
                    ? "0 8px 24px rgba(156, 39, 176, 0.4)"
                    : "0 4px 12px rgba(0,0,0,0.3)",
                  transition: "transform 0.3s",
                  "&:hover": {
                    transform: "translateY(-6px)",
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {tier.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={
                      tier.highlighted
                        ? "text.secondary"
                        : "rgba(255,255,255,0.7)"
                    }
                    gutterBottom
                  >
                    {tier.description}
                  </Typography>

                  <Typography variant="h4" fontWeight={800} mt={2}>
                    {tier.price}{" "}
                    <Typography
                      component="span"
                      variant="subtitle1"
                      fontWeight={400}
                      color={
                        tier.highlighted
                          ? "text.secondary"
                          : "rgba(255,255,255,0.7)"
                      }
                    >
                      {tier.frequency}
                    </Typography>
                  </Typography>
                  <Box mt={3} textAlign="left">
                    {tier.features.map((feature) => (
                      <Box
                        key={feature}
                        display="flex"
                        alignItems="center"
                        mb={1.5}
                      >
                        <CheckIcon
                          sx={{
                            fontSize: 20,
                            color: tier.highlighted ? "#9c27b0" : "#fff",
                            mr: 1,
                          }}
                        />
                        <Typography
                          variant="body2"
                          color={tier.highlighted ? "text.primary" : "white"}
                        >
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Button
                    variant={tier.highlighted ? "contained" : "outlined"}
                    fullWidth
                    sx={{
                      mt: 4,
                      borderRadius: 2,
                      fontWeight: 600,
                      color: tier.highlighted ? "white" : "white",
                      borderColor: tier.highlighted ? "transparent" : "white",
                      backgroundColor: tier.highlighted
                        ? "#9c27b0"
                        : "transparent",
                      "&:hover": {
                        backgroundColor: tier.highlighted
                          ? "#7b1fa2"
                          : "rgba(255,255,255,0.15)",
                        borderColor: "white",
                      },
                    }}
                  >
                    {tier.name === "Enterprise" ? "Contact Us" : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Layout>
  );
};

export default Pricing;
