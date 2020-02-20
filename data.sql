\c jobly

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
    equity DECIMAL NOT NULL,
    company_handle TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
    date_posted timestamp with time zone NOT NULL,
    constraint jobs_equity_check CHECK (( equity <= 1))
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
