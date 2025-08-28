// components/Header/Header.tsx
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import Link from "next/link";

const Header = () => {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background:
          "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* ===== Logo ===== */}
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, cursor: "pointer", color: "#fff" }}
        >
          LOGO
        </Typography>

        {/* ===== Nav Links ===== */}
        <Box sx={{ display: "flex", gap: 4 }}>
          {["Home", "Products", "Pricing", "Contact Us"].map((link) => (
            <Link
              key={link}
              href={
                link === "Home"
                  ? "/"
                  : `/${link.toLowerCase().replace(" ", "-")}`
              }
              passHref
              style={{ textDecoration: "none" }}
            >
              <Typography
                variant="body1"
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

        {/* ===== Login Button ===== */}
        <Button
          variant="outlined"
          sx={{
            color: "#fff",
            borderColor: "#fff",
            "&:hover": {
              borderColor: "#e91e63",
              color: "#e91e63",
            },
          }}
        >
          Login
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
