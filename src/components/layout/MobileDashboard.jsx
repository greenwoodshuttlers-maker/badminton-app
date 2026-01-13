import React, { useState } from "react";
import {
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const drawerWidth = 220;

export default function MobileDashboard({ children, onLogout, setPage }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleDrawer = () => setMobileOpen(!mobileOpen);

  const menu = [
    { text: "Dashboard", page: "dashboard" },
    { text: "Voting", page: "voting" },
    { text: "History", page: "history" },
    { text: "Logout", action: onLogout },
  ];

  const drawer = (
    <Box sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Menu
      </Typography>
      <List>
        {menu.map(({ text, page, action }) => (
          <ListItem
            button
            key={text}
            onClick={() => {
              toggleDrawer();
              if (action) return action();
              setPage(page);
            }}
          >
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ bgcolor: "#00695c" }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Badminton App
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
