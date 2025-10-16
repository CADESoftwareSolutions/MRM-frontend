import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
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
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, cursor: "pointer", color: "#fff" }}
        >
          CADE Solutions
        </Typography>
        <Box sx={{ display: "flex", gap: 4 }}>
          {["Home", "Services", "Pricing", "Contact Us"].map((link) => (
            <Link
              key={link}
              href={link === "Home" ? "/" : `/${link.replace(/\s+/g, "")}`}
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
        <Link href={"/Login/Login"} passHref style={{ textDecoration: "none" }}>
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
        </Link>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
