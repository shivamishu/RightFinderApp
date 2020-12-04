"use strict";
let cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 3000;
var fileUpload = require("express-fileupload");
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use("/", express.static(__dirname + "/public/webapp"));
//fileupload
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "tmp",
  })
);
// Allow cross origin requests
var router = express.Router();
var api_route = require("./routes/api_route");
var authMiddleware = require("./auth/authMiddleware");
// deafult
app.use("/api", router);

// test route
router.get("/", function (req, res) {
  console.log("default route called");
  res.render("index.html");
  // res.json({
  //   message: "welcome to AWS Project 1",
  // });
});

//api route for upload file
router.get("/employee_info", authMiddleware.Validate, api_route.employee_info);

//api route for update employee info
router.post("/employee_update", authMiddleware.Validate, api_route.employee_update);

//api route for mgr emails
router.get("/get_mgr", authMiddleware.Validate, api_route.get_mgr);

//api route for update employee info
router.post("/manager_update", authMiddleware.Validate, api_route.manager_update);

// girect report
router.get("/direct_report", authMiddleware.Validate, api_route.direct_report);

// admin report
router.get("/admin_report", authMiddleware.Validate, api_route.admin_report);

//api route for update file
router.get("/colleagues", authMiddleware.Validate, api_route.colleagues);

//api route to delete file
router.post("/upload_photo", authMiddleware.Validate, api_route.upload_photo);

//api route for update employee info
router.delete("/delete_photo", authMiddleware.Validate, api_route.delete_photo);

//api route for import linkedin profile
router.post("/import_linkedin", authMiddleware.Validate, api_route.import_linkedin);

// port added | Run Server
app.listen(port, function () {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;
