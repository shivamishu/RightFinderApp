"use strict";
var _ = require("lodash");
var fs = require("fs"),
  AWS = require("aws-sdk"),
  request = require("request"),
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
  });
var con = require("./dbconnconfig.js");
// var dbOperations = require("./dbOperations.js");
//database operations

function getUserDetails(res) {
  var user_id = "",
    user_name = "";
  if (!res.locals.user) {
    return res.status(400).send("User not available.");
  }
  res.locals.user.UserAttributes.forEach((attr) => {
    if (attr.Name === "email") {
      user_id = attr.Value;
    }
    if (attr.Name === "name") {
      user_name = attr.Value;
    }
  });
  return { user_id: user_id, user_name: user_name };
}

function performDatabaseOperations(req, res, sql_query, modeText, url) {
  // if (err) {
  // // con.end();
  // console.error("Database connection failed: " + err.stack);
  // con.destroy();
  // // res.status(400).send(err);
  // // return;
  // con = require("./dbConnection.js");
  // }
  // console.log("Connected to database.");
  con.query(sql_query, function (err, result, fields) {
    if (err) {
      // con.end();
      console.error(err.stack);
      res.send(err);
    } else {
      let msg = "";
      switch (modeText) {
        case "empinfo":
          res.send({
            code: 200,
            result: result[0],
          });
          break;
        case "photoupload":
          res.send({
            code: 200,
            success: "Photo uploaded successfully.",
            url: url,
          });
          break;
        case "getemployees":
          res.send({
            code: 200,
            result: result,
          });
          break;
        case "updateemp":
          res.send({
            code: 200,
            success: "Profile updated successfully.",
          });
          break;
        case "directreports":
        case "adminreports":
        case "getmgr":
          if(modeText === "getmgr"){
            result.unshift({emp_id: ""});
          }
          res.send({
            status: 200,
            result: result,
          });
          break;
        case "deletephoto":
          res.send({
            status: 200,
            success: "Photo deleted successfully",
          });
          break;
        case "linkedin":
          res.send({
            status: 200,
            result: url,
          });
          break;
        default:
          msg = "default success";
          break;
      }
      // con.end();
    }
    // con.end();
  });
}

// Upload a file to s3 Bucket
exports.upload_photo = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id,
    user_name = oUserDetails.user_name,
    fname = user_name.split(" ").slice(0, -1).join(" "),
    lname = user_name.split(" ").slice(-1).join(" ");
  // console.log("Uploading a file to S3 Bucket");
  if (!req.files) {
    return res.status(400).send("No files were uploaded.");
  }
  if(req.body.mgr_id){
    user_id = req.body.mgr_id;
  }
  // TODO: Add support for multiple file uploads
  // console.log("req.files >>>", req.files); // eslint-disable-line
  const inputFile = req.files.fileToUpload;
  if (_.isEmpty(inputFile)) {
    return res.status(400).send("No files were uploaded.");
  }

  let fileName =
    req.body.utime.split("").reverse().join("") + "-" + inputFile.name; //new unique file name
  const fileContent = fs.readFileSync(inputFile.tempFilePath);
  // const mimeType = inputFile.mimetype;
  // const fileSize = inputFile.size;

  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    ContentType: inputFile.mimetype,
    Body: fileContent,
  };

  s3.upload(params, function (err, data) {
    if (err) {
      res.status(400).send(err);
    }
    let a = data.Location.split("/");
    let urlFileName = a[a.length - 1];
    const url = `${process.env.AWS_CLOUD_FRONT}${urlFileName}`;
    // const user_input = {
    //   user_id: user_id,
    //   filename: fileName,
    //   fname: fname,
    //   lname: lname,
    //   utime: req.body.utime,
    //   ctime: req.body.ctime,
    //   description: req.body.description,
    //   file_url: url,
    //   mimetype: mimeType,
    //   size: fileSize,
    // };
    const update_query = `UPDATE sys.employee SET photo_url = '${url}' WHERE emp_id = '${user_id}'`;
    // dbOperations.uploadFile(req, res, user_input);
    performDatabaseOperations(req, res, update_query, "photoupload", url);
  });
};

// update the exisitng file for the current user
exports.update_photo = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id,
    user_name = oUserDetails.user_name,
    fname = user_name.split(" ").slice(0, -1).join(" "),
    lname = user_name.split(" ").slice(-1).join(" ");
  // console.log("Updating existing file to S3 Bucket");
  if (!req.files) {
    return res.status(400).send("No files were updated.");
  }
  // console.log("req.files >>>", req.files); // eslint-disable-line
  const inputFile = req.files.fileToUpload;
  if (_.isEmpty(inputFile)) {
    return res.status(400).send("No files were uploaded.");
  }
  const fileName = req.body.filename; //existing file name
  const fileContent = fs.readFileSync(inputFile.tempFilePath);
  const fileSize = inputFile.size; //updated size
  const mimeType = inputFile.mimetype;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    ContentType: inputFile.mimetype,
    Body: fileContent,
  };

  s3.upload(params, function (err, data) {
    if (err) {
      res.status(400).send(err);
    }
    let a = data.Location.split("/");
    let urlFileName = a[a.length - 1];
    const url = `${process.env.AWS_CLOUD_FRONT}${urlFileName}`;
    const user_input = {
      user_id: user_id,
      filename: fileName,
      fname: fname,
      lname: lname,
      utime: req.body.utime,
      ctime: req.body.ctime,
      description: req.body.description,
      file_url: url,
      mimetype: mimeType,
      size: fileSize,
    };
    dbOperations.updateFile(req, res, user_input);
  });
};
//get managers
exports.get_mgr = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id;
  const read_query = `SELECT DISTINCT emp_id FROM sys.employee WHERE is_mgr = 1;`;
  performDatabaseOperations(req, res, read_query, "getmgr");
};
// read the info for the current user
exports.employee_info = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id;
  const read_query = `SELECT * FROM sys.employee WHERE emp_id = '${user_id}'`;
  performDatabaseOperations(req, res, read_query, "empinfo");
  // res.status(200).json({
  //   message: "Success",
  // });
};
//admin report
exports.admin_report = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id;
  let read_query = `SELECT * FROM sys.employee WHERE ( mgr_id IS NULL OR mgr_id = '' ) AND (is_admin IS NULL OR is_admin = 0) AND ( is_mgr IS NULL OR is_mgr = 0 )`;
  performDatabaseOperations(req, res, read_query, "adminreports");
};
// update the exisitng file for the current user
exports.direct_report = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id;
  let read_query = `SELECT * FROM sys.employee WHERE mgr_id = '${user_id}'`;
  performDatabaseOperations(req, res, read_query, "directreports");
};

// delete the exisitng file for the current user
exports.colleagues = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id;
  const query = req.query.query;
  const available = req.query.available === "All" ? "" : req.query.available;
  let available_condition =
    available === "" ? "" : `AND available = '${available}' `;
  let read_query = `SELECT * FROM sys.employee WHERE ( emp_id LIKE '%${query}%' OR  name LIKE '%${query}%' OR  position LIKE '%${query}%' OR  dept_name LIKE '%${query}%' OR location LIKE '%${query}%' OR contact LIKE '%${query}%' OR skils LIKE '%${query}%' )${available_condition} AND emp_id  <> '${user_id}' ORDER BY name`;
  performDatabaseOperations(req, res, read_query, "getemployees");
};

// update the info for the current user
exports.employee_update = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id;
  const update_query = `UPDATE sys.employee SET name = '${req.body.name}', dob = '${req.body.dob}', gender = '${req.body.gender}', location = '${req.body.location}', contact = '${req.body.contact}', skils = '${req.body.skils}' WHERE emp_id = '${user_id}'`;
  performDatabaseOperations(req, res, update_query, "updateemp");
};

// update the info for the current user by manager
exports.manager_update = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id;
  let update_query;
  const available_since =
    req.body.available === "Yes" ? new Date().toDateString() : ""; 
  if(req.body.is_admin || req.body.is_mgr){
    user_id = req.body.user_id;
     update_query = `UPDATE sys.employee SET name = '${req.body.name}', dob = '${req.body.dob}', gender = '${req.body.gender}', location = '${req.body.location}', contact = '${req.body.contact}', skils = '${req.body.skils}', salary = '${req.body.salary}', position = '${req.body.position}', dept_name = '${req.body.dept_name}', available = '${req.body.available}', available_since = '${available_since}', mgr_id = '${req.body.mgr_id}' WHERE emp_id = '${req.body.emp_id}'`;  
  }else{
     update_query = `UPDATE sys.employee SET name = '${req.body.name}', dob = '${req.body.dob}', gender = '${req.body.gender}', location = '${req.body.location}', contact = '${req.body.contact}', skils = '${req.body.skils}', salary = '${req.body.salary}', position = '${req.body.position}', dept_name = '${req.body.dept_name}', available = '${req.body.available}', available_since = '${available_since}' WHERE emp_id = '${req.body.emp_id}' AND mgr_id = '${user_id}'`;
  }
  
  performDatabaseOperations(req, res, update_query, "updateemp");
};
//delete photo
exports.delete_photo = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id;
  let fileName = req.body.photo_url,
    cloudfronUrl = process.env.AWS_CLOUD_FRONT;
  fileName = fileName ? fileName : "";
  if (fileName.indexOf(cloudfronUrl) > -1) {
    fileName = fileName.replace(cloudfronUrl, "");
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
    };
    if(req.body.mgr_id){
      user_id = req.body.mgr_id;
    }
    s3.deleteObject(params, function (err, data) {
      if (err) {
        res.status(400).send(err);
      }
      const delete_query = `UPDATE sys.employee SET photo_url = '' WHERE emp_id = '${user_id}'`;
      performDatabaseOperations(req, res, delete_query, "deletephoto");
    });
  } else {
    const delete_query = `UPDATE sys.employee SET photo_url = '' WHERE emp_id = '${user_id}'`;
    performDatabaseOperations(req, res, delete_query, "deletephoto");
  }
};
//import linkedin profile
exports.import_linkedin = async function (req, res) {
  var oUserDetails = getUserDetails(res),
    user_id = oUserDetails.user_id;
  var linkedin_token = req.body.linkedin_token;
  var options = {
    method: "POST",
    url: `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&code=${linkedin_token}&redirect_uri=https://application.rightfinder.click&client_id=86pphz1g1cf3rm&client_secret=xCYIajdQi8rOhDqz`,
    headers: {},
  };
  request(options, function (error, response) {
    if (error) {
      res.sendStatus(404);
    } else {
      var oResponse = JSON.parse(response.body),
        access_token = oResponse.access_token;
      var options2 = {
        method: "GET",
        url: `https://api.linkedin.com/v2/me?projection=(id,profilePicture(displayImage~digitalmediaAsset:playableStreams))&oauth2_access_token=${access_token}`,
        headers: {},
      };
      request(options2, function (error2, response2) {
        if (error2) {
          res.sendStatus(404);
        } else {
          var profile_data = JSON.parse(response2.body),
            sPhotoUrl =
              profile_data.profilePicture["displayImage~"].elements[2]
                .identifiers[0].identifier;
          const update_query = `UPDATE sys.employee SET photo_url = '${sPhotoUrl}' WHERE emp_id = '${user_id}'`;
          // dbOperations.uploadFile(req, res, user_input);
          performDatabaseOperations(
            req,
            res,
            update_query,
            "linkedin",
            profile_data
          );
          // res.send({ status: 200, result: profile_data });
        }
      });
    }
  });
};
