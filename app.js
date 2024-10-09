const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const path = require("path");
const ejsMate = require('ejs-mate');
const methodOverride = require("method-override");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressErr = require("./utils/ExpressErr.js");
const {listingSchema, reviewSchema} = require("./models/Schema.js");
require('dotenv').config();

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
.then(() => {console.log("connected to DB");})
.catch((err) => {console.log(err);});

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);

const validateListing = (req,res,next)  => {
  let {error} = listingSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el) => el.message).join(",");
    console.log(error);
    throw new ExpressErr(400, errMsg);
  }else{
    next();
  }
};

const validateReview = (req,res,next) => {
  let {error} = reviewSchema.validate(req.body);
  if(error){
    let errMsg = error.details.map((el)=> el.message).join(",")
    throw new ExpressErr(400, errMsg)
  }else{
    next();
  }
};

app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

//Index Route
app.get("/listings", wrapAsync(async (req, res) => {
  const Listings = await Listing.find({});
  res.render("listings/index.ejs", { Listings });
  })
);

//New Route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

//Create Route
app.post("/listings", validateListing, wrapAsync(async (req, res) => {
  const newListing = new Listing(req.body.listing);
  console.  log(newListing)
  await newListing.save();
  res.redirect("/listings");
  })
);

//Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  res.render("listings/show.ejs", { listing });
  })
);

//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
  })
);

//Update Route
app.put("/listings/:id", validateListing, wrapAsync(async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
  })
);

//Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
  })
);

// review

app.post("/listings/:id/reviews", validateReview, wrapAsync(async(req,res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();

  res.redirect(`/listings/${listing._id}`)
  })
);

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