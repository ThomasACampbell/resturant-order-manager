module.exports = {
  // Check if user is authenticated (signed in)
  isAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash(
      'error',
      `You must be logged in to access: "${req.originalUrl.slice()}". Please log in first.`
    );
    res.redirect('/login');
  },

  // Check if user is not authenticated (not signed in)
  isNotAuthenticated: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/');
  },

  // Check if user has a specific role
  hasRole: function (roleId) {
    return (req, res, next) => {
      module.exports.checkRole(req, res, next, (userRoleId) => userRoleId === roleId);
    };
  },

  // Check if user has any of the specified roles
  hasAnyRole: function (...roleIDs) {
    return (req, res, next) => {
      module.exports.checkRole(req, res, next, (userRoleId) => roleIDs.includes(userRoleId));
    };
  },

  // Shared role-checking logic
  checkRole: function (req, res, next, roleCheckFn) {
    if (req.isAuthenticated() && roleCheckFn(req.user.roleId)) {
      return next();
    }
    req.flash('error', 'Access Denied, please sign in with an elevated user');
    res.redirect('/');
  },
};
