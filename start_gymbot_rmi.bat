@echo off
chcp 65001 >nul
title GymBot RMI Launcher
color 0A

:: ==============================================
:: Big Boss Gym RMI Server Starter
:: Location: C:\tepy\Year 4\Y4S2\BigBossGym_Final_Project\Project\
:: ==============================================

echo ******************************************
echo *       BIG BOSS GYM - RMI SYSTEM        *
echo *  Path: %cd%
echo ******************************************

:: 1. Verify Java Installation
echo 🔍 Checking Java version...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Java not found! Install JDK 17+ first
    pause
    exit /b
)

:: 2. Clean previous builds
echo 🧹 Cleaning previous compilation...
del bigboss_rmi\*.class 2>nul

:: 3. Compile RMI components
echo 🛠️  Compiling RMI system...
javac -encoding UTF-8 -d bigboss_rmi bigboss_rmi\*.java
if %errorlevel% neq 0 (
    echo ❌ Compilation failed! Check Java files
    pause
    exit /b
)

:: 4. Start RMI Server
echo 🚀 Launching RMI Server...
start "GymBot RMI Server" cmd /k "java -cp bigboss_rmi bigboss_rmi.GymServer"

:: 5. Verify startup
echo ⏳ Initializing RMI registry (3s)...
timeout /t 3 >nul

echo ✅ SYSTEM READY
echo ℹ️  Server running at: rmiregistry://localhost:1099/GymService
echo ℹ️  Keep this window open while using the chatbot
pause