pipeline {
    agent any
    options {
        disableConcurrentBuilds()
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Test') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE":/workspace \
                      -w /workspace/product-api \
                      node:22-alpine \
                      sh -c "npm install --silent && npm test"
                '''
            }
        }
        stage('Build') {
            steps {
                sh 'docker build -t stockwise-product-api ./product-api'
            }
        }
    }
    post {
        always {
            script {
                sh 'docker image prune -f || true'
            }
        }
    }
}