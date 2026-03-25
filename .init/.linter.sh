#!/bin/bash
cd /home/kavia/workspace/code-generation/oee-monitoring-and-visualization-platform-70-125/frontend_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

