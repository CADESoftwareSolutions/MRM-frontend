import React from "react";
import { Box, Typography } from "@mui/material";
import Link from "next/link";

const Footer = () => (
  <Box
    component="footer"
    sx={{
      background:
        "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 32px",
      flexWrap: "wrap",
    }}
  >
    <Typography variant="body2" sx={{ color: "#fff" }}>
      © {new Date().getFullYear()} Pathway. All rights reserved.
    </Typography>

    {/* <Box sx={{ display: "flex", gap: 4, mt: { xs: 2, sm: 0 } }}>
      {["Home", "Products", "Pricing", "Contact Us"].map((link) => (
        <Link
          key={link}
          style={{ textDecoration: "none" }}
          href={
            link === "Home" ? "/" : `/${link.toLowerCase().replace(" ", "-")}`
          }
          passHref
        >
          <Typography
            component="a"
            sx={{
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer",

              "&:hover": { color: "#e91e63" },
            }}
          >
            {link}
          </Typography>
        </Link>
      ))}
    </Box> */}
  </Box>
);

export default Footer;
