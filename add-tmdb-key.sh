#!/bin/bash
# Add TMDB_API_KEY for worker process

if ! grep -q "^TMDB_API_KEY=" .env.local; then
    echo "" >> .env.local
    echo "# TMDB API for worker process (no NEXT_PUBLIC prefix)" >> .env.local
    echo "TMDB_API_KEY=1b249624f332db818e2f9a5f57d919de" >> .env.local
    echo "✅ Added TMDB_API_KEY to .env.local"
else
    echo "✅ TMDB_API_KEY already exists in .env.local"
fi
