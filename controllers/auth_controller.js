const db = require("../models");
const config = require("../config/auth_config");
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");


exports.sign_up = (req, res) => {
  let organization;
  if(req.body.user_type == "admin" && req.body.organization !=='') {
    organization = req.body.organization
  }else{
    organization = "self"
  }
  // Save User to Database
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    user_type: req.body.user_type ? req.body.user_type : "admin",
    organization: organization
  })
    .then((user) => {
      
      res.status(200).send(user);
    })
    .catch((err) => {
      console.log("error");
      res.status(500).send({ message: err.message });
    });
};


exports.user_signin = (req, res) => {
  User.findOne({
    where: {
      email: req.body.email
    }
  })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      user.jwt_token = token
      user.save()
      res.status(200).send({
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        accessToken: token
      });

    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

