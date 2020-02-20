\c jobly_test

CREATE TABLE companies (
    handle TEXT PRIMARY KEY,
    name TEXT UNIQUE,
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