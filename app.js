require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
const admin = require("firebase-admin");
const serviceAccount = require("./smiletech-app-2023-firebase-adminsdk-p8k8d-626e8ecd52.json");
const http = require("http");
const socket = require("./socket");
const models = require("./models");
const route = require("./api/routes");
const { sequelize } = require("./models");
const { startCronJobs } = require("./api/src/cron/repaymentCron");
const { startCronJobs: startCicCronJobs } = require("./api/src/cic/cicCron");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8057;

const io = require("socket.io")(server, {
  cors: { origin: true },
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [
      "http://localhost:3000",
      "http://localhost:8057",
      "https://api.bankcs.smiletech.vn:8443",
    ];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "PUT, GET, POST, DELETE, OPTIONS",
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authentication, Access-Control-Allow-Credentials, Authorization",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "/")));

global.__basedir = __dirname;
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use(route);

app.get("/", async (req, res) => {
  res.send("Welcome to BankCs Project!");
});

app.get("/totals", async (req, res) => {
  try {
    const total_user = await models.users.count({
      where: {
        deleted: false,
        status: 1,
      },
    });

    const total_loan_application_complete = await models.loan_application.count(
      {
        where: {
          status: 5,
        },
      }
    );

    const total_order_complete = await models.order.count({
      where: {
        status: 3,
      },
    });

    res.json({
      total_user,
      total_order_complete,
      total_loan_application_complete,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
});

app.get("/healthcheck", (req, res) => {
  const data = {
    code: 200,
    responseTime: process.uptime(),
  };
  res.status(200).send(data);
});

server.listen(port, () => {
  socket({ io });
});

server.on("listening", async () => {
  console.log(`Listening on port http://localhost:${port}`);
  try {
    await sequelize.authenticate();
    console.log("Connection DB has been established successfully.");

    // Khởi động cron jobs
    startCronJobs();
    console.log("Repayment cron jobs started successfully.");

    // Khởi động CIC cron jobs
    startCicCronJobs();
    console.log("CIC cron jobs started successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
});

module.exports = io;
