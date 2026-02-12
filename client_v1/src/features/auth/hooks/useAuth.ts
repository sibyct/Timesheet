import { useCallback, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/core/store/hooks'
import { useNavigate } from 'react-router-dom'
import {
  selectAuth,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from '../store/auth.selector'
import {
  logout as logoutAction,
  setUser,
  clearError,
  setLoading,
} from '../store/auth.slice'
import { storageService } from '@/services/storage/localStorage.service'
import { STORAGE_KEYS } from '@/shared/constants/storage.constants'
import { authApi } from '../api/auth.api'
//import type { User } from '../types/auth.types'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  // Selectors
  const auth = useAppSelector(selectAuth)
  const user = useAppSelector(selectUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isLoading = useAppSelector(selectAuthLoading)
  const error = useAppSelector(selectAuthError)

  /**
   * Check if user is authenticated
   * Validates token presence and auth state
   */
  const checkAuth = useCallback((): boolean => {
    const token = storageService.get(STORAGE_KEYS.ACCESS_TOKEN)
    return !!token && isAuthenticated
  }, [isAuthenticated])

  /**
   * Initialize auth state from storage
   * Called on app mount to restore session
   */
  const initializeAuth = useCallback(async () => {
    const token = storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN)

    if (token && !user) {
      dispatch(setLoading(true))
      try {
        // Fetch current user from API
        const currentUser = await authApi.getCurrentUser()
        dispatch(setUser(currentUser))
      } catch (error) {
        // Token is invalid, clear it
        console.error('Failed to initialize auth:', error)
        storageService.remove(STORAGE_KEYS.ACCESS_TOKEN)
        storageService.remove(STORAGE_KEYS.REFRESH_TOKEN)
        dispatch(logoutAction())
      } finally {
        dispatch(setLoading(false))
      }
    }
  }, [user, dispatch])

  /**
   * Logout user
   * Clears tokens and redirects to login
   */
  const logout = useCallback(
    async (redirectToLogin = true) => {
      try {
        // Call logout API endpoint
        await authApi.logout()
      } catch (error) {
        console.error('Logout API error:', error)
        // Continue with local logout even if API fails
      } finally {
        // Clear Redux state
        dispatch(logoutAction())

        // Redirect to login
        if (redirectToLogin) {
          navigate('/login', { replace: true })
        }
      }
    },
    [dispatch, navigate]
  )

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) return false
      return user.role === role
    },
    [user]
  )

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      if (!user) return false
      return roles.includes(user.role)
    },
    [user]
  )

  /**
   * Check if user has all specified roles
   */
  const hasAllRoles = useCallback(
    (roles: string[]): boolean => {
      if (!user) return false
      // For single role systems, this checks if user role matches any
      // For multi-role systems, you'd check user.roles array
      return roles.every((role) => user.role === role)
    },
    [user]
  )

  /**
   * Check if user has permission
   * Extend based on your permission system
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false
      
      // Example: if you have permissions array in user object
      // return user.permissions?.includes(permission) ?? false
      
      // Role-based permission example
      if (user.role === 'ADMIN') return true
      
      // Implement your permission logic here
      return false
    },
    [user]
  )

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!user) return false
      return permissions.some((permission) => hasPermission(permission))
    },
    [user, hasPermission]
  )

  /**
   * Get user initials for avatar
   */
  const getUserInitials = useCallback((): string => {
    if (!user || !user.name) return 'U'
    
    const names = user.name.trim().split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return user.name.substring(0, 2).toUpperCase()
  }, [user])

  /**
   * Get user display name
   */
  const getUserDisplayName = useCallback((): string => {
    if (!user) return 'Guest'
    return user.name || user.email || 'User'
  }, [user])

  /**
   * Update user profile
   */
//   const updateProfile = useCallback(
//     async (updates: Partial<User>) => {
//       if (!user) throw new Error('No user logged in')

//       try {
//         const updatedUser = await authApi.updateProfile(user.id, updates)
//         dispatch(setUser(updatedUser))
//         return updatedUser
//       } catch (error) {
//         console.error('Update profile error:', error)
//         throw error
//       }
//     },
//     [user, dispatch]
//   )

  /**
   * Clear auth error
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError())
  }, [dispatch])

  /**
   * Get access token
   */
  const getAccessToken = useCallback((): string | null => {
    return storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN)
  }, [])

  /**
   * Get refresh token
   */
  const getRefreshToken = useCallback((): string | null => {
    return storageService.get<string>(STORAGE_KEYS.REFRESH_TOKEN)
  }, [])

  /**
   * Check if token is expired
   * Decode JWT and check expiration
   */
  const isTokenExpired = useCallback((): boolean => {
    const token = getAccessToken()
    if (!token) return true

    try {
      // Decode JWT token (payload is the second part)
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(window.atob(base64))
      
      if (!payload.exp) return false // No expiration set
      
      const expirationTime = payload.exp * 1000 // Convert to milliseconds
      const currentTime = Date.now()
      
      // Consider expired if less than 1 minute remaining
      return currentTime >= expirationTime - 60000
    } catch (error) {
      console.error('Error decoding token:', error)
      return true
    }
  }, [getAccessToken])

  /**
   * Refresh access token
   */
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      logout(false)
      return false
    }

    try {
      const response = await authApi.refreshToken(refreshToken)
      
      // Update tokens
      storageService.set(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken)
      //storageService.set(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken)
      
      // Update user in Redux
      dispatch(setUser(response.user))
      
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Refresh failed, logout user
      logout()
      return false
    }
  }, [getRefreshToken, dispatch, logout])

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback((): boolean => {
    return hasRole('ADMIN')
  }, [hasRole])

//   /**
//    * Check if user email is verified
//    */
//   const isEmailVerified = useCallback((): boolean => {
//     return user?.emailVerified ?? false
//   }, [user])

  /**
   * Get user avatar URL or initials
   */
  const getUserAvatar = useCallback((): { type: 'url' | 'initials'; value: string } => {
    if (user?.avatar) {
      return { type: 'url', value: user.avatar }
    }
    return { type: 'initials', value: getUserInitials() }
  }, [user, getUserInitials])

  // Auto-initialize auth on mount
  useEffect(() => {
    const token = storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN)
    if (token && !user && !isLoading) {
      initializeAuth()
    }
  }, []) // Run only once on mount

  return {
    // State
    user,
    isAuthenticated: checkAuth(),
    isLoading,
    error,
    auth,

    // Actions
    logout,
    //updateProfile,
    clearError: clearAuthError,
    initializeAuth,
    refreshAccessToken,

    // Role & Permission checks
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    isAdmin,
//    isEmailVerified,

    // Utilities
    getUserInitials,
    getUserDisplayName,
    getUserAvatar,
    getAccessToken,
    getRefreshToken,
    isTokenExpired,
    checkAuth,
  }
}