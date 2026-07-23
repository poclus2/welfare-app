@echo off
echo Exporting Medusa database from Docker container...
docker exec api-medusa_db-1 pg_dump -U medusa -d medusa_welfare -f /tmp/welfare_dump.sql
docker cp api-medusa_db-1:/tmp/welfare_dump.sql welfare_dump.sql
echo.
echo Database successfully exported to welfare_dump.sql !
echo You can now import this file to your Railway PostgreSQL database.
pause
