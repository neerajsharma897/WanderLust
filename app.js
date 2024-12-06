const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require('ejs-mate');
const methodOverride = require("method-override");
const ExpressErr = require("./utils/ExpressErr.js");
const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const session = require("express-session");
const flash = require("connect-flash");
require('dotenv').config();

main()
.then(() => {console.log("connected to DB");})
.catch((err) => {console.log(err);});

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

const sessionOptions = {
  secret : process.env.secret,
  resave: false,
  saveUninitialized : true,
  cookies:{
    expires: Date.now() * 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(session(sessionOptions));
app.use(flash());

app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  next();
})


app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

app.use("/listings", listings)
app.use("/listings/:id/reviews", reviews)


app.all("*",(req,res,next) => {
  throw new ExpressErr(404, "Page not found");
});

// Error handling middleware
app.use((err,req,res,next)=>{
  let {status=404 , message="Something went wrong"} = err;
  res.status(status).render("listings/error.ejs",{message})
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});