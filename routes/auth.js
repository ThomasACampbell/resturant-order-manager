var express = require("express");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var crypto = require("crypto");
var db = require("../models");
var UserService = require("../services/UserService");
const hashPassword = require("../utils/hashPassword");
var userService = new UserService(db);
var router = express.Router();
var { isNotAuthenticated, isAuthenticated } = require("./authMiddlewares");

passport.use(
  new LocalStrategy(function verify(email, password, cb) {
    userService.getOneByEmail(email).then((data) => {
      if (data === null) {
        return cb(null, false, { message: "Incorrect email or password." });
      }
      crypto.pbkdf2(
        password,
        data.salt,
        310000,
        32,
        "sha256",
        function (err, hashedPassword) {
          if (err) {
            return cb(err);
          }
          if (!crypto.timingSafeEqual(data.encryptedPassword, hashedPassword)) {
            return cb(null, false, {
              message: "Incorrect email or password.",
            });
          }
          return cb(null, data);
        },
      );
    });
  }),
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roleId: user.RoleId,
      role: user.role?.name,
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user); //// This user object will be available as req.user
  });
});

var router = express.Router();

router.get("/login", isNotAuthenticated, function (req, res, next) {
  const email = req.user?.email ?? 0;
  res.render("login", {
    email,
    title: "Login",
  });
});

router.post(
  "/login/password",
  isNotAuthenticated,
  passport.authenticate("local", {
    successReturnToOrRedirect: "/",
    failureRedirect: "/login",
    failureMessage: true,
    failureFlash: true, // Automatically sets a flash message on failure
  }),
);

router.get("/signup", isNotAuthenticated, async function (req, res, next) {
  const email = req.user?.email ?? 0;
  // Flash messages are automatically available via res.locals, no need to pass in
  res.render("signup", { email, title: "Sign Up" });
});

router.post("/signup", isNotAuthenticated, async (req, res, next) => {
  const firstName = req.body.firstName.trim();
  const lastName = req.body.lastName.trim();
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  // Basic validation
  if (!firstName || !lastName || !email || !password) {
    req.flash("error", "All fields are required");
    return res.redirect("/signup"); // Redirect to signup with error message
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    req.flash("error", "Please enter a valid email address");
    return res.redirect("/signup");
  }

  // Check if the user already exists
  const existingUser = await userService.getOneByEmail(email);
  if (existingUser) {
    req.flash("error", `The email "${email}" is already in use.`);
    return res.redirect("/signup");
  }

  // Password validation: at least 8 characters, must contain a number and a letter
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    req.flash(
      "error",
      "Password must be at least 8 characters long and contain both letters and numbers", //Todo, replace with global-scoped rules for pw strength which will be used by DB as well.
    );
    return res.redirect("/signup");
  }

  // Proceed with password hashing and user creation
  hashPassword(password, (err, { salt, hashedPassword }) => {
    if (err) return next(err);

    userService.create(firstName, lastName, email, salt, hashedPassword);

    req.flash(
      "success",
      `Account with email: "${email}" created successfully. Please log in.`,
    );
    res.redirect("/login");
  });
});

router.post("/logout", function (req, res, next) {
  req.session.basket = [];

  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

//Not tested route
router.post("/changemypassword", isAuthenticated, (req, res, next) => {
  hashPassword(req.body.newPassword, (err, { salt, hashedPassword }) => {
    if (err) return next(err);

    userService
      .updatePassword(req.user.id, salt, hashedPassword)
      .then(() => res.redirect("/profile"))
      .catch(next);
  });
});

module.exports = router;
