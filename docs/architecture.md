# StockWise Architecture

Browser → Nginx proxy (8080) → React frontend and three APIs (product 3001, inventory 3002, sales 3003) → MySQL 8.4. All services communicate on a private Docker bridge network. MySQL data persists in named volume `mysql_data`. Jenkins runs separately and builds/tests/deploys images tagged by build number.
