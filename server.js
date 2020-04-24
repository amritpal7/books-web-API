const   express         = require("express"),
        dotenv          = require("dotenv"),
        path            = require("path"),
        cookieParser    = require('cookie-parser'),
        mongoSanitize   = require("express-mongo-sanitize"),
        helmet          = require("helmet"),
        xss             = require("xss-clean"),
        rateLimit       = require("express-rate-limit"),
        hpp             = require("hpp"),
        cors             = require("cors"),
        fileUpload      = require('express-fileupload'),
        errorHandler    = require("./middleware/error"),
        connectDB       = require("./config/db");

dotenv.config({ path: "./config/config.env"});

connectDB();

const app = express();


const books = require("./routes/books");
const contributors = require("./routes/contributors");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
// if(process.env.NODE_ENV === 'development'){
//         app.use(morgan('dev'));
// }

// File uploading
app.use(fileUpload());

//  Data sanitizer
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent xss attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
    windowMs: 10*60*1000, // 10 mins
    max: 100
})

app.use(limiter);

// Prevent http param pollution
app.use(hpp());

//Enable CORS
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));


// 
app.use("/api/v1/books", books);
app.use("/api/v1/contributors", contributors);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

