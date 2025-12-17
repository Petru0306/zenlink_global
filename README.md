# Zenlink

## Backend: local Postgres setup (no Docker)

This project is currently intended to run against a **local PostgreSQL** instance.

### Run the backend

From repo root:

```bash
./mvnw spring-boot:run
```

    ## Fix: `permission denied for schema public`

If you see:
- **`ERROR: permission denied for schema public`**

it means the DB user you configured (e.g. `zenlink_user`) can connect, but **cannot create tables**. Since `spring.jpa.hibernate.ddl-auto=update`, Hibernate will try to create tables and fail.

Run the bootstrap SQL as a superuser:

```bash
psql -U postgres -f db/postgres/bootstrap.sql
```

