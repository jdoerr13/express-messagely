const jwt = require("jsonwebtoken");
//put const bcrypt + BCRYPT_WORK_FACTOR, express & db &  in user MODEL user.js
const Router = require("express").Router;//import ONY the Router object from the express module
const router = new Router();//When you create a new instance of the router, you can define routes and middleware for that particular router instance without affecting the global application router or other router instances. 

const User = require("../models/user");
const {SECRET_KEY} = require("../config");
const ExpressError = require("../expressError");


/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async function(req, res, next) {
    try {
        //req.body already contains both username and password, use this approach to extract both properties in one step.
        let  {username, password} = req.body;

        if (await User.authenticate(username, password)) {//this function contains the bcrypt.compare
            //BUT IT DOesn't contain the jwt.sign
            let token = jwt.sign({ username }, SECRET_KEY);
            //then update the login timestamp
            User.updateLoginTimestamp(username);
            return res.json({ message: "Logged in!", token });
        } else {
            throw new ExpressError("Invalid username/password", 400);
        }
    }
    catch (e){
        return next(e);
    }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async function(req, res, next){

    try {
        //returns object with properties including username, firstname, lastname, phone, so ONLY need to extract the username here. 
        let {username} = await User.register(req.body); //this contains the bcrypt.hash
        console.log(req.body)
        let token = jwt.sign({username}, SECRET_KEY);
        User.updateLoginTimestamp(username);
        return res.json({token});
      }
    
      catch (e) {
        return next(e);
      }
    });




module.exports = router;

// "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkpET0VSUjEzIiwiaWF0IjoxNzAyMzg4NjgwfQ.Yhi4MaEKGHwSkJ7d8b8zvQ6BxuzBW56zatU8buLQnmo"