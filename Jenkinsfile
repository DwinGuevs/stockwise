pipeline {
  agent any
  options { timestamps(); disableConcurrentBuilds() }
  environment { TAG = "${BUILD_NUMBER}" }
  triggers { pollSCM('H/2 * * * *') }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Test') {
      steps {
        sh '''
          docker run --rm -v "$WORKSPACE:/workspace" -w /workspace/product-api node:22-alpine sh -c "npm install --silent && npm test"
          docker run --rm -v "$WORKSPACE:/workspace" -w /workspace/inventory-api node:22-alpine sh -c "npm install --silent && npm test"
          docker run --rm -v "$WORKSPACE:/workspace" -w /workspace/sales-api node:22-alpine sh -c "npm install --silent && npm test"
        '''
      }
    }
    stage('Build') {
      steps { sh 'docker compose build' }
    }
    stage('Deploy') {
      steps { sh 'docker compose up -d --no-build --remove-orphans' }
    }
    stage('Smoke Test') {
      steps {
        sh '''
          for i in $(seq 1 30); do
            if curl -fsS http://localhost:8080/api/products >/dev/null && curl -fsS http://localhost:8080/api/inventory >/dev/null && curl -fsS http://localhost:8080/api/sales >/dev/null; then exit 0; fi
            sleep 3
          done
          echo "Smoke test failed"; exit 1
        '''
      }
    }
  }
  post {
    success { echo 'StockWise pipeline succeeded.' }
    failure { echo 'Pipeline failed. Check the failed stage and service logs.' }
    always { sh 'docker image prune -f || true'; echo 'Pipeline finished.' }
  }
}
