import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
  Divider,
  Tooltip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Category,
  LocalShipping,
} from '@mui/icons-material'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  path?: string
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'users',
    label: 'Users',
    icon: <PeopleIcon />,
    path: '/users',
  },
  {
    id: 'products',
    label: 'Products',
    icon: <InventoryIcon />,
    children: [
      {
        id: 'products-list',
        label: 'All Products',
        icon: <InventoryIcon />,
        path: '/products',
      },
      {
        id: 'products-categories',
        label: 'Categories',
        icon: <Category />,
        path: '/products/categories',
      },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: <ShoppingCartIcon />,
    children: [
      {
        id: 'orders-list',
        label: 'All Orders',
        icon: <ShoppingCartIcon />,
        path: '/orders',
      },
      {
        id: 'orders-shipping',
        label: 'Shipping',
        icon: <LocalShipping />,
        path: '/orders/shipping',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <AssessmentIcon />,
    path: '/reports',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
  },
]

interface SidebarMenuProps {
  collapsed: boolean
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ collapsed }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [openItems, setOpenItems] = useState<string[]>([])

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      // Toggle submenu
      setOpenItems((prev) =>
        prev.includes(item.id)
          ? prev.filter((id) => id !== item.id)
          : [...prev, item.id]
      )
    } else if (item.path) {
      // Navigate to path
      navigate(item.path)
    }
  }

  const isActive = (path?: string) => {
    if (!path) return false
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isOpen = openItems.includes(item.id)
    const active = isActive(item.path)

    const listItem = (
      <ListItemButton
        selected={active}
        onClick={() => handleItemClick(item)}
        sx={{
          pl: 2 + level * 2,
          minHeight: 48,
          justifyContent: collapsed ? 'center' : 'initial',
          px: collapsed ? 2.5 : 2,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: collapsed ? 0 : 3,
            justifyContent: 'center',
            color: active ? 'primary.main' : 'inherit',
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <>
            <ListItemText
              primary={item.label}
              sx={{
                opacity: 1,
                '& .MuiListItemText-primary': {
                  fontWeight: active ? 600 : 400,
                },
              }}
            />
            {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
          </>
        )}
      </ListItemButton>
    )

    if (collapsed && !hasChildren) {
      return (
        <Tooltip key={item.id} title={item.label} placement="right">
          {listItem}
        </Tooltip>
      )
    }

    return (
      <React.Fragment key={item.id}>
        {listItem}
        {hasChildren && !collapsed && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }

  return (
    <Box sx={{ pt: 1 }}>
      <List>
        {menuItems.slice(0, 5).map((item) => renderMenuItem(item))}
      </List>
      <Divider sx={{ my: 1 }} />
      <List>
        {menuItems.slice(5).map((item) => renderMenuItem(item))}
      </List>
    </Box>
  )
}