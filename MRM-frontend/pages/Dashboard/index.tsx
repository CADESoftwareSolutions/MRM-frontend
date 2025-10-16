import React, { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Tooltip,
  CssBaseline,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import PaymentIcon from "@mui/icons-material/Payment";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/router";

const fullWidth = 240;
const collapsedWidth = 60;
const appBarHeight = 64;

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openList, setOpenList] = useState(true);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleList = () => setOpenList((prev) => !prev);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      const response = await fetch("http://localhost:5000/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response, "--");

      const data = await response.json();

      console.log("Logout Successful!", data);
      if (response.ok) {
        console.log("Logout Successful!", data);
        router.push("/");
      }
    } catch {
      alert("Server error. Please try again.");
    }
  };

  const menuItems = [
    { text: "Checks", icon: <CheckBoxIcon /> },
    { text: "Documents", icon: <DescriptionIcon /> },
    { text: "Payments", icon: <PaymentIcon /> },
    { text: "Reports", icon: <BarChartIcon /> },
    { text: "Settings", icon: <SettingsIcon /> },
  ];

  const sidebarItemStyle = {
    color: "#fff",
    minWidth: 0,
    mr: sidebarOpen ? 2 : "auto",
    justifyContent: "center",
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #000000 0%, #1e1e3f 40%, #3c0f5f 100%)",
        color: "#fff",
      }}
    >
      <CssBaseline />

      <Box
        sx={{
          width: sidebarOpen ? fullWidth : collapsedWidth,
          flexShrink: 0,
          position: "fixed",
          height: "100vh",
          zIndex: 1300,
          bgcolor: "rgba(0, 0, 0, 0.7)",
          transition: "width 0.3s",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar sx={{ justifyContent: sidebarOpen ? "flex-end" : "center" }}>
          <IconButton onClick={toggleSidebar} sx={{ color: "#fff" }}>
            <MenuIcon />
          </IconButton>
        </Toolbar>

        <List sx={{ px: 1 }}>
          <ListItemButton onClick={toggleList}>
            <ListItemIcon sx={sidebarItemStyle}>
              {openList ? <ExpandLess /> : <ExpandMore />}
            </ListItemIcon>
            <Tooltip title={!sidebarOpen ? "Pages" : ""} placement="right">
              {sidebarOpen && <ListItemText primary="Pages" />}
            </Tooltip>
          </ListItemButton>

          <Collapse in={openList} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {menuItems.map((item) => (
                <Tooltip
                  key={item.text}
                  title={!sidebarOpen ? item.text : ""}
                  placement="right"
                >
                  <ListItemButton
                    sx={{
                      pl: sidebarOpen ? 4 : 0,
                      justifyContent: sidebarOpen ? "flex-start" : "center",
                      "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                    }}
                  >
                    <ListItemIcon sx={sidebarItemStyle}>
                      {item.icon}
                    </ListItemIcon>
                    {sidebarOpen && <ListItemText primary={item.text} />}
                  </ListItemButton>
                </Tooltip>
              ))}
            </List>
          </Collapse>
        </List>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          width: "100%",
          marginLeft: collapsedWidth,
          transition: "margin-left 0.3s ease",
        }}
      >
        <AppBar
          position="fixed"
          sx={{
            width: `calc(100% - ${collapsedWidth}px)`,
            marginLeft: collapsedWidth,
            bgcolor: "rgba(0, 0, 0, 0.3)",
            boxShadow: "none",
            transition: "width 0.3s, margin-left 0.3s",
            zIndex: 1100,
          }}
        >
          <Toolbar sx={{ justifyContent: "flex-end" }}>
            <IconButton
              onClick={handleMenuOpen}
              size="large"
              aria-controls={menuOpen ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={menuOpen ? "true" : undefined}
              sx={{ p: 0 }}
            >
              <Avatar sx={{ bgcolor: "#6a0dad" }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>

        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={menuOpen}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
              mt: 1.5,
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        <Box sx={{ p: 3, marginTop: `${appBarHeight}px` }}>
          <Typography variant="h4">Welcome to your dashboard! 👋</Typography>
          <Typography sx={{ mt: 2 }}>
            Interact with your data, upload PDFs, pay bills, and more.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;
