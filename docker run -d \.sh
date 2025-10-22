  docker run -d \
            --name egfilm_db \
            --restart unless-stopped \
            --network app-network \
            -p "5432:5432" \
            -v postgres_data:/var/lib/postgresql/data \
            -e POSTGRES_USER="egfilm_admin" \
            -e POSTGRES_PASSWORD="anihortes" \
            -e POSTGRES_DB="egmovie-database" \
            --health-cmd="pg_isready -h localhost -p 5432 -U egfilm_admin" \
            --health-interval=10s \
            --health-timeout=5s \
            --health-retries=5 \
            postgres:16-alpine > /dev/null