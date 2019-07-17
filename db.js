var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser')
var nodemailer = require('nodemailer');
var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');
var session  = require('express-session');
var cookieParser = require('cookie-parser');
var flash    = require('connect-flash');

/*var transporter = nodemailer.createTransport({
  service: 'yahoo',
  auth: {
    user: 'placeholder0101@yahoo.com',
    pass: 'holdthatplace'
  }
});
*/


var app = express();
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({extended: false}));




app.use(session({
	secret: 'vidyapathaisalwaysrunning',
	resave: true,
	saveUninitialized: true
 } ));







app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(cookieParser());


var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "frienddb"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");

});


passport.serializeUser(function(user, done) {
  done(null, user.userid);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
  con.query("select * from user where userid = "+id,function(err,rows){	
    done(err, rows[0]);
  });
  });



passport.use('local-login', new LocalStrategy({
  
  usernameField : 'email',
  passwordField : 'password',
  passReqToCallback : true 
},
function(req, email, password, done) { 

  console.log('no user');

   con.query("SELECT * FROM user WHERE email = '" + email + "'",function(err,rows){
if (err)
          return done(err);
 if (!rows.length) {
          return done(null, false, console.log('no user')); 
          
      } 


      if (!( rows[0].password == password))
          return done(null, false, console.log('pass')); 

      
      return done(null, rows[0]);			

});



}));













app.get('/regform',function(request,response){
  
  return response.render('reg');
 
});
app.get('/logform',function(request,response){
  
  return response.render('log');
 
});
app.get('/profile', isLoggedIn, function(req, res) {
  



  var friendids=[];
  var friends=[];


  var promise = new Promise(function(resolve, reject) { 

    con.query("SELECT ftwo FROM friendship where (fone=" + (req.user).userid + ")", function (err, result, fields) {
      if (err) throw err;
      for(i=0;i<result.length;i++){

        
        friendids[i]=result[i].ftwo
      }
      con.query("SELECT fone FROM friendship where (ftwo=" + (req.user).userid + ")", function (err, result, fields) {

        for(i=0;i<result.length;i++){

        
          friendids.push(result[i].fone);
        }
      resolve(friendids);


    });
    });

    
     
})

promise 
    .then(function(res) { 


      return new Promise((resolve, reject) => { // (*)
        for(i=0;i<res.length;i++){
          con.query("SELECT name FROM user where (userid=" + res[i] + ")", function (err, result, fields) {
           
            //console.log(result[0].name);
          friends.push(result[0].name)
             
          });
         
        }
        setTimeout(() => resolve(friends), 1000);
      });

      
      
    
    
    }).then(function(result) { // (***)

      var useremails=[];
      con.query("SELECT * FROM user where (userid!=" + (req.user).userid + ")", function (err, result, fields) {
        if (err) throw err;
        for(i=0;i<result.length;i++)
        useremails[i]=result[i]
        //console.log(useremails);
    
        res.render("welcome", {
          user: req.user,
          peoples: useremails,
          friendships: friends
          //friendemail: "hello"
          
        });
    
    
        
      });
      
    
    });



  
  
  
});

function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}



app.post('/add',function(request,response){

var sql = "INSERT INTO friendship (fone,ftwo) VALUES ('" + (request.body).logid + "','" + (request.body).usid + "')";
con.query(sql, function (err, result) {
  if (err) throw err;
  

  
});


  con.query("SELECT * FROM friendship", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  });

  //response.end('friend added');

  response.redirect('/profile');

});



app.post('/login', passport.authenticate('local-login', {
  successRedirect : '/profile', // redirect to the secure profile section
  failureRedirect : '/logform', // redirect back to the signup page if there is an error
  
}),
function(req, res) {
  console.log("hello");

 

});


app.post('/register',function(request,response){
  
  
  
    var sql = "INSERT INTO user (name, email,password,gender,age) VALUES ('" + (request.body).name + "','" + (request.body).email + "' , '" + (request.body).password + "','" + (request.body).gender + "','" + (request.body).age + "')";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 record inserted");
    });

    /*var mailOptions = {
      from: 'placeholder0101@yahoo.com',
      to: (request.body).email,
      subject: 'Sending Email using Node.js',
      text: 'thanks for joining my friends app'
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    */

    con.query("SELECT * FROM user", function (err, result, fields) {
      if (err) throw err;
      console.log(result);
    });
  
 response.redirect('/logform')
 //response.send(request.body);
});





app.listen(3000);
  