\c jobly

DROP TABLE jobs;
DROP TABLE companies;
DROP TABLE users;

CREATE TABLE companies (
    handle TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    num_employees INTEGER,
    description TEXT,
    logo_url TEXT
);

CREATE TABLE jobs (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title TEXT NOT NULL,
    salary FLOAT NOT NULL,
    equity FLOAT NOT NULL,
    company_handle TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
    date_posted timestamp with time zone NOT NULL,
    constraint jobs_equity_check CHECK (( equity <= 1))
);

CREATE TABLE users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    photo_url TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO companies (handle, name, num_employees, description, logo_url) 
    VALUES  ('app', 'apple', 10000, 'big company', 'none' ), 
            ('ibm', 'ibm', 5000, 'big company', 'none' ), 
            ('nor', 'nordstrom', 10, 'big company', 'none' );

INSERT INTO jobs (title, salary, equity, company_handle, date_posted)
    VALUES  ('developer', 500, 0.3, 'app', CURRENT_TIMESTAMP),
            ('sales person', 300, 0.05, 'nor', CURRENT_TIMESTAMP),
            ('sales person', 400, 0.05, 'app', CURRENT_TIMESTAMP),
            ('IT', 450, 0.3, 'ibm', CURRENT_TIMESTAMP);

INSERT INTO users (username, password, first_name, last_name, email, photo_url)
    VALUES  ('user1', 'abcd', 'User', 'One', 'user1@user.com', 'isjfs'),
            ('user2', 'abcd', 'User', 'Two', 'user2@user.com', 'none'),
            ('user3', 'abcd', 'User', 'Three', 'user3@user.com', NULL);


-- {
--   "_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluMSIsImlzX2FkbWluIjpmYWxzZSwiaWF0IjoxNTgyMjQ1ODExfQ.iULQhWRojCoI3zxd_t5dDyq6omoWNYqSpl8Z8vA8WoE"
-- }