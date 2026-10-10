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
                // Run npm install & test directly inside a temporary node container mounted to the absolute Jenkins workspace
                sh '''
                    docker run --rm \
                      -v stockwise_jenkins_jenkins_home:/var/jenkins_home \
                      -w /var/jenkins_home/workspace/stockwise-pipeline/product-api \
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