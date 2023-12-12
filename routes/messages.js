const Router = require("express").Router;

const Message = require("../models/message");
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth");

const router = new Router();


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function(req, res, next){
    try {
        const {id} = req.params;
        const message= await Message.get(id);
        return res.json({message});
    } catch(e) {
        return next(e);
    }
})



router.get("/", async function(req, res, next){
    try {
        const messages = await Message.all();
        return res.json({messages});
    } catch(e) {
        return next(e);
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", async function(req, res, next){
    try {
        //returns object with properties including username, firstname, lastname, phone, so ONLY need to extract the username here. 
        let {id, from_username, to_username, body, sent_at} = await Message.create(req.body); //this contains the bcrypt.hash
        console.log(req.body)
        return res.json({ id, from_username, to_username, body, sent_at });
      }
      catch (e) {
        return next(e);
      }
    });


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", async function(req, res, next){
    try{
        const { id } = req.params;
        const { read_at } = await Message.markRead(id);
        return res.json ({ id, read_at})

    }catch (e){
        return next(e);
    }
})


module.exports = router;