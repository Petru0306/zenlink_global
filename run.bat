@echo off
REM Simple batch script - sets OPENAI_API_KEY from .env manually
REM For better .env parsing, use run.ps1 instead

REM Read OPENAI_API_KEY from .env (simple version)
for /f "tokens=2 delims==" %%a in ('findstr /b "OPENAI_API_KEY" .env') do set OPENAI_API_KEY=%%a
for /f "tokens=2 delims==" %%a in ('findstr /b "OPENAI_MODEL" .env') do set OPENAI_MODEL=%%a
for /f "tokens=2 delims==" %%a in ('findstr /b "OPENAI_MAX_OUTPUT_TOKENS" .env') do set OPENAI_MAX_OUTPUT_TOKENS=%%a
for /f "tokens=2 delims==" %%a in ('findstr /b "OPENAI_TEMPERATURE" .env') do set OPENAI_TEMPERATURE=%%a

REM Run Spring Boot
call mvn spring-boot:run
