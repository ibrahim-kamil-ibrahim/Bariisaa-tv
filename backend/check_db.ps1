$env:PGPASSWORD='12341234'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -d naik_db -c 'SELECT COUNT(*) FROM "User";'
