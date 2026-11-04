@echo off
echo ========================================================
echo   Starting PrivacyShield Hackathon MVP...
echo ========================================================
echo   Backend Port : 5000
echo   Dashboard UI : http://localhost:5000
echo   Database     : SQLite (Zero-Knowledge WAL Mode)
echo ========================================================
start http://localhost:5000
node backend/src/server.js

