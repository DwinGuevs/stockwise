# Stockwise Microservices — Full CI/CD Setup Guide

This document provides complete instructions to install, configure, and execute the automated CI/CD pipeline for the **Stockwise** microservices architecture.

---

## 1. System Architecture & Port Allocations

The project uses a microservices architecture managed via Docker containers and coordinated by Jenkins.

| Service / Container | Technology Stack | Access URL / Port | Role |
| :--- | :--- | :--- | :--- |
| **App Gateway / Proxy** | Nginx (`1.27-alpine`) | `http://localhost:8080` | Entry point routing traffic to frontend and backend APIs |
| **Jenkins CI/CD** | Docker (`jenkins/jenkins:lts`) | `http://localhost:8081` | Automation server running build pipelines |
| **Frontend** | React / Vite | Internal (`:80`) | Web client user interface |
| **Product API** | Node.js (`22-alpine`) | Internal (`:3000`) | Microservice managing product catalog |
| **Inventory API** | Node.js (`22-alpine`) | Internal (`:3000`) | Microservice managing stock levels |
| **Sales API** | Node.js (`22-alpine`) | Internal (`:3000`) | Microservice managing sales transactions |

---

## 2. Prerequisites

Before starting, ensure the host machine has the following tools installed:

1. **Docker Desktop** (with WSL 2 backend on Windows or native Docker engine on macOS/Linux).
2. **Git** (version 2.x or later).
3. **GitHub Account** with access to the project repository and a **Personal Access Token (PAT)** (`repo` scope permissions).

---

## 3. Step 1: Launch Jenkins Docker Container

Jenkins runs inside a Docker container configured to access the host machine's Docker engine.

### On Windows (PowerShell):

```powershell
docker run -d `
  --name jenkins `
  --restart always `
  -p 8081:8080 `
  -p 50000:50000 `
  -v jenkins_home:/var/jenkins_home `
  -v //var/run/docker.sock:/var/run/docker.sock `
  -v /usr/bin/docker:/usr/bin/docker `
  jenkins/jenkins:lts
```

### On macOS / Linux (Terminal):

```bash
docker run -d \
  --name jenkins \
  --restart always \
  -p 8081:8080 \
  -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $(which docker):/usr/bin/docker \
  jenkins/jenkins:lts
```

### Enable Docker Permissions inside Container:

Run the following command to allow Jenkins to execute Docker operations without permissions errors:

```bash
docker exec -u 0 jenkins chmod 666 /var/run/docker.sock
```

---

## 4. Step 2: Initial Jenkins Configuration

1. Retrieve the temporary initial admin password:
   ```bash
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```
2. Navigate to **`http://localhost:8081`** in your browser.
3. Paste the password and select **Install Suggested Plugins**.
4. Create your administrator credentials.

### Store GitHub Credentials in Jenkins:

1. Go to **Manage Jenkins** $\rightarrow$ **Credentials** $\rightarrow$ **System** $\rightarrow$ **Global credentials (unrestricted)**.
2. Click **Add Credentials**.
3. Select **Username with password**:
   * **Username**: Your GitHub Username
   * **Password**: Your GitHub Personal Access Token (PAT)
   * **ID**: `github-token`
4. Click **Create**.

---

## 5. Step 3: Create and Configure the Pipeline Job

1. Go to the Jenkins Dashboard and click **New Item**.
2. Name the job `stockwise-pipeline`, select **Pipeline**, and click **OK**.
3. Under **Build Triggers**:
   * Check **Poll SCM**.
   * Set **Schedule** to `* * * * *` (polls GitHub every minute for new pushes).
4. Under **Pipeline**:
   * Set **Definition** to **Pipeline script from SCM**.
   * Set **SCM** to **Git**.
   * Enter your GitHub Repository URL.
   * Select `github-token` under **Credentials**.
   * Set **Branch Specifier** to `*/main`.
   * Set **Script Path** to `Jenkinsfile`.
5. Click **Save**.
6. Click **Build Now** once manually to bind the repository schedule and perform the initial pipeline run.

---

## 6. How the Automated Pipeline Works

When code is pushed to `main`, Jenkins automatically executes the following phases in the `Jenkinsfile`:

1. **Checkout**: Pulls the latest code commit from GitHub.
2. **Parallel Testing**: Spins up lightweight `node:22-alpine` containers to execute unit test suites concurrently across `product-api`, `inventory-api`, and `sales-api`.
3. **Parallel Image Building**: Builds Docker images concurrently for all microservices (`stockwise-product-api`, `stockwise-inventory-api`, `stockwise-sales-api`, `stockwise-frontend`, `stockwise-proxy`).
4. **Deployment**: Deploys the stack seamlessly using `docker compose`.
5. **Post Cleanup**: Prunes dangling Docker build images to optimize disk storage.

---

## 7. Verifying Automated Execution

1. Make any edit in your local repository codebase.
2. Stage, commit, and push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Update feature logic"
   git push origin main
   ```
3. Open Jenkins (`http://localhost:8081`). Within 60 seconds, a new pipeline run will trigger automatically.
4. Access the deployed application live via Nginx proxy at **`http://localhost:8080`**.