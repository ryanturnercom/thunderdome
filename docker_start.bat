@echo off
echo Starting thunderdome container...

echo Removing any existing container...
docker rm -f thunderdome 2>nul

echo Starting new container...
docker run -d --name thunderdome --restart unless-stopped -p 3000:3000 --env-file .env thunderdome

echo Done. Access at http://localhost:3000
pause
