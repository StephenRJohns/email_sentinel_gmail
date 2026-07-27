#!/bin/bash
nohup google-chrome --window-size=1280,800 "https://mail.google.com" </dev/null >/dev/null 2>&1 &
disown
