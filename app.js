if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Listing = require('./models/listing');

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// =============================================
// TEMPLATE FUNCTION (Add right after styles)
// =============================================
const categoryPage = (title, description) => `
    <div style="${containerStyle}">
        <h1 style="${titleStyle}">${title}</h1>
        <p style="${textStyle}">${description}</p>
        <div style="margin-top: 40px;">
            <a href="/listings" style="${linkStyle}">Browse all listings</a>
        </div>
    </div>
`;

const dbUrl = process.env.ATLASDB_URL;

main().then(() => {
    console.log("connected to DB");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbUrl, {
        tls: true,
        tlsAllowInvalidCertificates: false
    });
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter: 24*3600,
});

store.on("error", ()=>{
    console.log("ERROR in MONGO SESSION STORE",err);
});

const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires: Date.now() + 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly: true,
    }
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.get('/search', async (req, res) => {
    const query = req.query.q;
    try {
      const results = await Listing.find({
        title: new RegExp(query, 'i')
      });
      res.render('listings/searchResults', { results, query });
    } catch (err) {
      console.error(err);
      res.redirect('/listings');
    }
});

app.get("/trending", (req, res) => {
    res.render("categories/show", {
        title: "Trending Destinations",
        description: "Discover the most popular stays around the world"
    });
});

app.get("/rooms", (req, res) => {
    res.render("categories/show", {
        title: "Unique Rooms",
        description: "Find extraordinary spaces that tell a story"
    });
});

app.get("/iconic-cities", (req, res) => {
    res.render("categories/show", {
        title: "Iconic Cities",
        description: "Live like a local in the world's most famous cities"
    });
});

app.get("/mountains", (req, res) => {
    res.render("categories/show", {
        title: "Mountain Escapes",
        description: "Breathtaking views and fresh alpine air"
    });
});

app.get("/castles", (req, res) => {
    res.render("categories/show", {
        title: "Castle Stays",
        description: "Live your royal fantasy in historic castles"
    });
});

app.get("/amazing-pools", (req, res) => {
    res.render("categories/show", {
        title: "Amazing Pools",
        description: "Dive into properties with stunning swimming pools"
    });
});

app.get("/camping", (req, res) => {
    res.render("categories/show", {
        title: "Camping Adventures",
        description: "Unique outdoor experiences in nature"
    });
});

app.get("/farms", (req, res) => {
    res.render("categories/show", {
        title: "Farm Stays",
        description: "Rustic charm and agricultural experiences"
    });
});

app.get("/arctic", (req, res) => {
    res.render("categories/show", {
        title: "Arctic Getaways",
        description: "Experience the magic of the polar regions"
    });
});

app.get("/domes", (req, res) => {
    res.render("categories/show", {
        title: "Dome Stays",
        description: "Sleep under the stars in geodesic domes"
    });
});

app.get("/boats", (req, res) => {
    res.render("categories/show", {
        title: "Boat Stays",
        description: "Sleep on the water in unique vessels"
    });
});


//error handlers
app.all("*", (req,res,next) =>{
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err,req,res,next) =>{
    let {statusCode=500, message = "something went wrong!"} = err;
    res.status(statusCode).render("./listings/error.ejs",{message});
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});