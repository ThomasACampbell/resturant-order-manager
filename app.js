var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const flash = require("connect-flash");
const session = require("express-session");
var passport = require("passport");
var SQLiteStore = require("connect-sqlite3")(session);

const { toShortDate } = require("./utils/dateHelper");

const methodOverride = require("method-override");

var indexRouter = require("./routes/index");
var authRouter = require("./routes/auth");
var usersRouter = require("./routes/users");
var itemsRouter = require("./routes/items");
var categoriesRouter = require("./routes/categories");
var ordersRouter = require("./routes/orders");
var menuRouter = require("./routes/menu");
var basketRouter = require("./routes/basket");

var db = require("./models");

db.sequelize
  .sync({ force: false })
  .then(() => {
    //Must be true to autosync
    console.log(
      "✅ Database successfully synced! You may now visit the website.",
    );
  })
  .catch((error) => {
    console.error("Error syncing the database:", error);
  });

var app = express();

app.use(
  session({
    secret: "that cat is fat",
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore(),
  }),
);
app.use(passport.authenticate("session"));

app.use(flash());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Use ?_method=PUT or look for _method in POST body
app.use(methodOverride("_method"));

app.use((req, res, next) => {
  console.log("Current Path:", req.path);
  res.locals.currentPath = req.path; //This is so every view can access the currentPath variable, used for navbar highlighting the current tab
  res.locals.user = req.user || 0;
  res.locals.errorMessage = req.flash("error"); // Add error messages to res.locals
  res.locals.successMessage = req.flash("success");
  next();
});

app.locals.toShortDate = toShortDate; //makes this helper be globally available

app.use("/", indexRouter);
app.use("/", authRouter);
app.use("/users", usersRouter);
app.use("/items", itemsRouter);
app.use("/categories", categoriesRouter);
app.use("/orders", ordersRouter);
app.use("/menu", menuRouter);
app.use("/basket", basketRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
