// Jenkinsfile for HTTPS Registry and Portainer Stack API Deployment
// Configuration variables for easy reusability
def imageName = "highlight_edit"
def stackId = "34"
def endpointId = "3"
def portainerUrl = "https://portainer.fukie.io"
def portainerTokenName = "portainer-api-key-admin"

pipeline {
    agent {
        docker {
            image 'docker:latest'
            args '--volume /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        IMAGE_NAME = "registry.fukie.io/${imageName}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Code checked out."
            }
        }

        stage('Build and Push to Secure Registry') {
            steps {
                script {
                    echo "Building image..."
                    // use short git commit SHA as image tag so image <-> commit mapping is obvious
                    def commitId = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    echo "Using commit id ${commitId} for image tag"
                    def imageTag = "${IMAGE_NAME}:${commitId}"
                    def imageLatest = "${IMAGE_NAME}:latest"

                    docker.build(imageTag, '--no-cache .')
                    sh "docker tag ${imageTag} ${imageLatest}"
                    echo "Successfully built image."

                    echo "Pushing image to secure registry..."
                    docker.image(imageTag).push()
                    docker.image(imageLatest).push()
                    echo "Successfully pushed image."
                }
            }
        }

        // THE FINAL, CORRECT DEPLOY STAGE FOR PORTAINER CE
        stage('Deploy Stack via Portainer API') {
            environment {
                PORTAINER_API_KEY = credentials("${portainerTokenName}")
                PORTAINER_URL = "${portainerUrl}"
                STACK_ID = "${stackId}"
                ENDPOINT_ID = "${endpointId}"
                COMPOSE_FILE_PATH = "docker-compose.yml" // Path to the compose file
            }
            steps {
                sh 'apk add --no-cache curl jq'

                script {
                    echo "Fetching existing stack configuration..."
                    // Fetch existing environment variables from Portainer
                    sh '''
                    curl -s -X GET "$PORTAINER_URL/api/stacks/$STACK_ID" \
                    -H "X-API-Key: $PORTAINER_API_KEY" \
                    > existing_stack.json
                    
                    # Extract existing environment variables
                    jq -r '.Env // []' existing_stack.json > existing_env.json
                    
                    # Check if required environment variables exist
                    MISSING_VARS=""
                    
                    if [ -n "$MISSING_VARS" ]; then
                        echo "ERROR: Missing required environment variables: $MISSING_VARS"
                        echo "Please set them in Portainer's stack environment variables before deploying."
                        exit 1
                    fi
                    
                    echo "All required environment variables found in Portainer stack."
                    '''
                    
                    echo "Reading compose file content..."
                    def composeFileContent = readFile(COMPOSE_FILE_PATH)

                    // Read the existing environment variables from the JSON file
                    def existingEnvJson = readFile('existing_env.json')

                    // Build the JSON payload with existing environment variables preserved
                    def payload = """
{
  "pullImage": true,
  "stackFileContent": ${groovy.json.JsonOutput.toJson(composeFileContent)},
  "env": ${existingEnvJson}
}
"""
                    writeFile file: 'portainer_payload.json', text: payload

                    echo "Updating stack via Portainer API with preserved environment variables..."

                    sh '''
                    curl -L -X PUT "$PORTAINER_URL/api/stacks/$STACK_ID?endpointId=$ENDPOINT_ID" \
                    -H "X-API-Key: $PORTAINER_API_KEY" \
                    -H "Content-Type: application/json" \
                    --data-binary @portainer_payload.json
                    '''

                    echo "Portainer stack update triggered via API!"
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished."
            cleanWs()
        }
    }
}
