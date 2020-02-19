\c jobly

CREATE TABLE companies (
    handle TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    num_employees INTEGER,
    description TEXT,
    logo_url TEXT
);

INSERT INTO companies (handle, name, num_employees, description, logo_url) VALUES ('app', 'apple', 10000, 'big company', 'none' ), ('ibm', 'ibm', 5000, 'big company', 'none' ), ('nor', 'nordstrom', 10, 'big company', 'none' );