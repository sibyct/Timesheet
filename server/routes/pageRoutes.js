const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user.js');

/**
 * Try to resolve an authenticated user from request cookies.
 * Returns the user document or null.
 */
async function getUserFromCookies(req) {
  try {
    const cookies = req.cookies || {};
    const { userId, username } = cookies;

    if (!req.isAuthenticated() || !userId || !username) {
      return null;
    }

    const id = Number.parseInt(userId, 10);
    if (Number.isNaN(id)) {
      return null;
    }

    const user = await User.findOne({ userId: id, username }).exec();
    return user || null;
  } catch (err) {
    // keep failure silent here — caller will send login page
    console.error('Error resolving user from cookies:', err);
    return null;
  }
}

router.get('/login', async (req, res) => {
  const user = await getUserFromCookies(req);
  if (user) {
    // role === 0 is treated as admin (preserved from original)
    return user.role === 0 ? res.redirect('admin') : res.redirect('user');
  }

  return res.sendFile(path.join(__dirname, '../../client', 'login.html'));
});

router.get('/user', (req, res) => {
  return res.sendFile(path.join(__dirname, '../../client', 'index.html'));
});

router.get('/admin', async (req, res) => {
  const user = await getUserFromCookies(req);
  if (user) {
    if (user.role === 0) {
      return res.sendFile(path.join(__dirname, '../../client', 'admin.html'));
    }
    return res.redirect('user');
  }

  return res.sendFile(path.join(__dirname, '../../client', 'login.html'));
});

module.exports = router;
