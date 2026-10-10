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
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                }
            }
            steps {
                dir('product-api') {
                    sh 'npm install --silent'
                    sh 'npm test'
                }
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