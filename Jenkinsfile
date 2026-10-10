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

        stage('Test Services') {
            parallel {
                stage('Test Product API') {
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

                stage('Test Inventory API') {
                    agent {
                        docker {
                            image 'node:22-alpine'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('inventory-api') {
                            sh 'npm install --silent'
                            sh 'npm test'
                        }
                    }
                }

                stage('Test Sales API') {
                    agent {
                        docker {
                            image 'node:22-alpine'
                            reuseNode true
                        }
                    }
                    steps {
                        dir('sales-api') {
                            sh 'npm install --silent'
                            sh 'npm test'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Product API') {
                    steps {
                        sh 'docker build -t stockwise-product-api ./product-api'
                    }
                }

                stage('Build Inventory API') {
                    steps {
                        sh 'docker build -t stockwise-inventory-api ./inventory-api'
                    }
                }

                stage('Build Sales API') {
                    steps {
                        sh 'docker build -t stockwise-sales-api ./sales-api'
                    }
                }
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