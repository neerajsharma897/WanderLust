const express = require("express");
const router = express.Router({mergeParams: true});
const Listing = require("../models/listing");
const Review = require("../models/review.js")
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressErr = require("../utils/ExpressErr.js");
const { reviewSchema } = require("../models/Schema.js");

const validateReview = (req,res,next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error){
      let errMsg = error.details.map((el)=> el.message).join(",")
      throw new ExpressErr(400, errMsg)
    }else{
      next();
    }
};

// index reviews
router.post("/", validateReview, wrapAsync(async(req,res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();

  res.redirect(`/listings/${listing._id}`)
  })
);

// delete review
router.delete("/:reviewId", wrapAsync(async(req,res)=>{
  let {id, reviewId} = req.params;
  await Listing.findByIdAndUpdate(id, {$pull : {reviews: reviewId}});
  await Review.findByIdAndDelete(reviewId);

  res.redirect(`/listings/${id}`);
})
);

module.exports = router;