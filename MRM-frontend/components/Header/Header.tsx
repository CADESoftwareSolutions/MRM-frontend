import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MouseEvent, useState } from "react";
import ServicesDropDown from "./ServicesDropDown/ServicesDropDown";

const Header = () => {
  const pathname = usePathname();
  const [openServices, setOpenServices] = useState<boolean>(false);
  const [headerAnchorEl, setHeaderAnchorEl] =
    useState<HTMLButtonElement | null>(null);

  const handleOpenServices = (e: MouseEvent<HTMLButtonElement>) => {
    setHeaderAnchorEl(e.currentTarget);
    setOpenServices(true);
  };

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
        <Box sx={{ display: "flex", gap: 4, alignItems: "center" }}>
          {["Home", "Services", "Pricing", "Contact Us"].map((link) => {
            const href = link === "Home" ? "/" : `/${link.replace(/\s+/g, "")}`;
            if (link === "Services") {
              return (
                <Button
                  key={link}
                  onClick={(e) => handleOpenServices(e)}
                  variant="text"
                  disableRipple
                  sx={{
                    color: "#fff",
                    fontWeight: 500,
                    textTransform: "none",
                    textDecoration: "none",
                    fontSize: 16,
                    "&:hover": { color: "#e91e63", bgcolor: "transparent" },
                  }}
                >
                  {link}
                </Button>
              );
            }
            return (
              <Link
                key={link}
                href={href}
                passHref
                style={{ textDecoration: "none" }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: pathname !== href ? "#fff" : "#e91e63",
                    fontWeight: 500,
                    cursor: "pointer",
                    "&:hover": { color: "#e91e63" },
                  }}
                >
                  {link}
                </Typography>
              </Link>
            );
          })}
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
      {openServices && (
        <ServicesDropDown
          openServices={openServices}
          setOpenServices={setOpenServices}
          headerAnchorEl={headerAnchorEl}
        />
      )}
    </AppBar>
  );
};

export default Header;
