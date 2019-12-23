@echo off
title UeihNart
start c:\MongoDB\bin\mongod --dbpath c:\MongoDB\data
start npm run dev
code .