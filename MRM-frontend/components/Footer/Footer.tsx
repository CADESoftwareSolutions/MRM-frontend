import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import Link from "next/link";

const Footer = () => {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
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
        © {year ?? ""} Cade. All rights reserved.
      </Typography>

      <Box sx={{ display: "flex", gap: 4, mt: { xs: 2, sm: 0 } }}>
        {["Home", "Services", "Pricing", "Contact Us"].map((link) => (
          <Link
            key={link}
            style={{ textDecoration: "none" }}
            href={link === "Home" ? "/" : `/${link.replace(/\s+/g, "")}`}
          >
            <Typography
              component="span"
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
      </Box>
    </Box>
  );
};

export default Footer;
