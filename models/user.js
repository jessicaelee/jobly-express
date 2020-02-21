const db = require('../db');
const sqlForPartialUpdate = require('../helpers/partialUpdate');
const bcrypt = require('bcrypt')
const { BCRYPT_WORK_FACTOR } = require('../config');

class User {
    static async create(user) {
        const { username, password, first_name, last_name, email, photo_url } = user;
        let hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

        const result = await db.query(
            `INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin) 
             VALUES ($1, $2, $3, $4, $5, $6, false) 
             RETURNING username, first_name, last_name, email, photo_url, is_admin`,
            [username, hashedPassword, first_name, last_name, email, photo_url]);

        return result.rows[0];
    }

    /** Finds all users; returns {users: [{username, first_name, last_name, email}, ...]}*/
    static async findAll() {
        const result = await db.query(`SELECT username, first_name, last_name, email FROM users`);
        return result.rows;

    }

    /** Gets user by username; returns {user: {username, first_name, last_name, email, photo_url}} */
    static async findOne(username) {
        const userResult = await db.query(`
            SELECT username, first_name, last_name, email, photo_url 
            FROM users 
            WHERE username=$1`, [username]);

        if (!userResult.rows.length) {
            throw { message: `There is no user with the username, ${username}`, status: 404 }
        }

        return userResult.rows[0];
    }

    /** Updates existing user; returns updated user {user: {username, first_name, last_name, email, photo_url}} */
    static async update(username, body) {
        const { query, values } = sqlForPartialUpdate("users", body, "username", username);
        const results = await db.query(query, values);

        if (!results.rows.length) {
            throw { message: `There is no user with the username, ${username}`, status: 404 }
        }

        const userQuery = await db.query(
            `SELECT username, first_name, last_name, email, photo_url
          FROM users
          WHERE username=$1`, [username]
        );

        return userQuery.rows[0];
    }

    /** removes existing user */
    static async delete(username) {
        const results = await db.query(
            `DELETE FROM users
            WHERE username=$1
            RETURNING username`, [username]);

        if (!results.rows.length) {
            throw { message: `There is no user with the username, ${username}`, status: 404 }
        }
    }

    static async authenticate(username, password) {
        let result = await db.query(`SELECT username, password, is_admin FROM users WHERE username = $1`, [username]);
        let user = result.rows[0];
        
        if (await bcrypt.compare(password, user.password)) {
            return user;
        } else {
            throw { message: `Invalid username/password`, status: 404 }
        }
        // return user && await bcrypt.compare(password, user.password);
    }

}

module.exports = User;