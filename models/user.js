/** User class for message.ly 
 * COMBINING MOST OF THE AUTH.JS FILE PLUS THE BASIC CLASS STRUCTURE TO RESUSE MODELS
*/
const db = require("../db");
const bcrypt = require("bcrypt")
const ExpressError = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config");
// const { ensureCorrectUser } = require("../middleware/auth");

/** User of the site. */

class User {

 
  constructor({ username, password, first_name, last_name, phone, join_at = null, last_login_at = null }) {
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
    this.join_at = join_at; //  can set a default value if needed
    this.last_login_at = last_login_at; //  can set a default value if needed
  }
 /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({username, password, first_name, last_name, phone}) {
     // Hash the password before storing it in the database
     const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

     const result = await db.query(
       `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, first_name, last_name, phone`,
       [username, hashedPassword, first_name, last_name, phone]
     );
 
     const newUser = result.rows[0];
     return new User(newUser);
   }
   

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
       FROM users
       WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];

    if (user) {
      // Compare the provided password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
      return passwordMatch;
    }

    return false; // User not found
  }


  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) { 
    const currentTime = new Date();//JS object
    await db.query (
      "UPDATE users SET last_login_at = $1 WHERE username = $2", 
      [currentTime, username]
    );
  }



  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() {
    const results = await db.query (
      `SELECT username, first_name, last_name, phone FROM users 
      ORDER BY last_name, first_name`
    );
    return results.rows;
   }



  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  static async get(username) { 
    const results = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at 
      FROM users 
      WHERE username = $1`,[username]
    );
    const user = results.rows[0];

    if (user === undefined) {
      const err = new ExpressError(`No such customer: ${username}`);
      err.status = 404;
      throw err;
    }
    return new User(user);

  }


  /** Return messages from this user.
   *
   * [{id, to_username, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT 
          m.id, 
          m.to_username, 
          m.body, 
          m.sent_at, 
          m.read_at,
          u.first_name, 
          u.last_name, 
          u.phone
      FROM messages AS m
      JOIN users AS u ON m.to_username = u.username
      WHERE m.from_username = $1`,
      [username]
    );
  
    return result.rows.map((m) => ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.first_name,
        last_name: m.last_name,
        phone: m.phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }


  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id,
              m.from_username,
              u.first_name,
              u.last_name,
              u.phone,
              m.body,
              m.sent_at,
              m.read_at
        FROM messages AS m
         JOIN users AS u ON m.from_username = u.username
        WHERE to_username = $1`,
      [username]);

  return result.rows.map(m => ({
    id: m.id,
    from_user: {
      username: m.from_username,
      first_name: m.first_name,
      last_name: m.last_name,
      phone: m.phone,
    },
    body: m.body,
    sent_at: m.sent_at,
    read_at: m.read_at
  }));

   }
}


module.exports = User;