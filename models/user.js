const db = require('../db');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

class User {
    static async create(user) {
        const { username, password, first_name, last_name, email, photo_url, is_admin } = user;

        const result = await db.query(
            `INSERT INTO users (username, password, first_name, last_name, email, photo_url, is_admin) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING username, first_name, last_name, email, photo_url, is_admin`,
            [username, password, first_name, last_name, email, photo_url, is_admin]);

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
}

module.exports = User;