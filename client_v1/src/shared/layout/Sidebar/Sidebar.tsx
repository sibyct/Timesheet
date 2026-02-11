import React from 'react'
import {
  Drawer,
  Box,
  useTheme,
} from '@mui/material'
import { SidebarMenu } from './SidebarMenu'

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
  width: number
  collapsedWidth: number
  isMobile: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  collapsed,
  onClose,
  width,
  collapsedWidth,
  isMobile,
}) => {
  const theme = useTheme()
  const currentWidth = collapsed ? collapsedWidth : width

  const drawerContent = (
    <Box sx={{ overflow: 'auto', height: '100%' }}>
      <SidebarMenu collapsed={collapsed} />
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: currentWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ height: 64 }} /> {/* Toolbar spacer */}
      {drawerContent}
    </Drawer>
  )
}