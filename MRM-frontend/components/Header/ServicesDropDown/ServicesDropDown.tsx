import React, { Dispatch, SetStateAction } from "react";
import { ourFeatures } from "../../HomePage/AboutUs/AboutUs";
import { Box, Menu, MenuItem } from "@mui/material";
import Link from "next/link";

type ServicesDropDownProps = {
  openServices: boolean;
  setOpenServices: Dispatch<SetStateAction<boolean>>;
  headerAnchorEl: HTMLButtonElement | null;
};

const ServicesDropDown: React.FC<ServicesDropDownProps> = ({
  openServices,
  setOpenServices,
  headerAnchorEl,
}) => {
  const handleClose = () => {
    setOpenServices(false);
  };

  return (
    <Box>
      <Menu
        id="services-menu"
        anchorEl={headerAnchorEl}
        open={openServices}
        disableScrollLock
        onClose={handleClose}
      >
        {ourFeatures.map((feature) => (
          <MenuItem
            key={feature.title}
            component={Link}
            href={`/Services/${feature.slug}`}
            sx={{
              justifyContent: "flex-start",
              fontSize: ".9rem",
              fontWeight: 600,
              color: "#1c2e4a",
              px: 2,
              borderBottom: "1px solid #e5e7eb",
              "&:last-of-type": {
                borderBottom: "none",
              },
              "&:hover": { bgcolor: "#f0fdf4" },
              whiteSpace: "normal",
              lineHeight: 1.2,
            }}
          >
            {feature.title}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default ServicesDropDown;
