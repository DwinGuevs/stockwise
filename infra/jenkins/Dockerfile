FROM jenkins/jenkins:lts-jdk21
USER root

# Install required tools and fetch the official Linux static Docker CLI binary directly into /usr/bin/docker
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl git && \
    curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-26.1.4.tgz -o /tmp/docker.tgz && \
    tar -xzf /tmp/docker.tgz -C /tmp && \
    mv /tmp/docker/docker /usr/bin/docker && \
    chmod +x /usr/bin/docker && \
    rm -rf /tmp/docker* /var/lib/apt/lists/*

USER jenkins