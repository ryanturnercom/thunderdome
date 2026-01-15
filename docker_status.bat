@echo off
echo Thunderdome container status:
echo.
docker ps -a --filter "name=thunderdome" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
pause
