# StockWise — Inventory and Sales Management System

A learning/demo project for the SYSIN containerization and CI/CD final project. Modules: Product API, Inventory API, Sales API, and a browser frontend. Nginx is the single entry point; MySQL stores persistent records.

## Requirements
Docker Desktop with Compose, Git, and a browser.

## Run locally
1. Copy `.env.example` to `.env` and change the passwords.
2. Run `docker compose up -d --build`.
3. Open http://localhost:8080.
4. Check `docker compose ps` and `docker compose logs -f`.

The database is persisted in the `mysql_data` named volume. To preserve data, do not use `docker compose down -v`.

## Pages
Dashboard, Products, Inventory, Sales. The seed database has Wireless Mouse and USB Keyboard.

## API routes (through proxy)
- GET/POST `/api/products`; GET/PUT/DELETE `/api/products/:id`
- GET `/api/inventory`; GET `/api/inventory/low-stock`; GET `/api/inventory/:productId`; POST `/api/inventory/receive`
- GET/POST `/api/sales`; GET `/api/sales/:id`
- Each service has `/health` internally.

## Jenkins
Jenkins sample stack: `cd infra/jenkins && docker compose up -d --build`. Open http://localhost:8081. Configure a Pipeline job pointing at this repository and `Jenkinsfile`. The sample Jenkinsfile uses Poll SCM every ~2 minutes; configure a webhook instead if your Jenkins instance is securely reachable. Ensure Jenkins can use Docker and has `docker compose` available. The provided Docker-in-Docker socket approach is for a controlled school/lab machine only.

## Pipeline
Checkout → Test → Build → Deploy → Smoke Test. Image tags use the Jenkins build number through `TAG`. Tests run before image build/deploy so a failing test prevents the new deployment. For reliable production-grade rollback, add a release/previous-tag strategy and test it in your environment.

## Persistence check
Create a product, run `docker compose down` then `docker compose up -d`, and confirm the record remains. Never use `-v` for this test.

## Team
Add member names and roles here before submission.

## Important project notes
This is a functional educational starter. Review and test the pipeline and webhook on your machine; Jenkins credentials, repository URL, webhook endpoint, and rollback demonstration must be configured for your actual environment. Do not commit `.env`.
