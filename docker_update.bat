@echo off
echo Updating thunderdome...

echo Pulling latest code...
git pull

echo Stopping container...
docker stop thunderdome

echo Removing old container...
docker rm thunderdome

echo Building new image...
docker build -t thunderdome .

echo Starting new container...
docker run -d --name thunderdome --restart unless-stopped -p 3000:3000 --env-file .env thunderdome

echo Done. Access at http://localhost:3000
pause
