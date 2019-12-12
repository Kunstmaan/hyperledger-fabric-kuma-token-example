#!/bin/bash

# Exit immediately if a pipeline returns non-zero status.
# Result of pipeline is the last command
# Unset variables are considered an error
set -e -o pipefail
USER=$(whoami)

# Remove interraction
export DEBIAN_FRONTEND=noninteractive
HYPERLEDGER_VERSION='1.1.0'
HYPERLEDGER_BASE_VERSION='0.4.6'
COUCHDB_VERSION='0.4.10'
NODEJS_VERSION='8.9.4'
DOCKER_COMPOSE_VERSION='1.19.0'

puts() {
    local GREEN='\033[0;32m'
    local NC='\033[0m'
    >&2 echo -e "${GREEN}$*${NC}"
}

err() {
  local RED='\033[0;31m'
  local NC='\033[0m'
  >&2 echo -e "${RED}$*${NC}"
}

warn() {
  local YELLOW='\033[0;33m'
  local NC='\033[0m'
  >&2 echo -e "${YELLOW}$*${NC}"
}

abort() {
    err "Aborting..."
    exit 1
}

usage() {
    err "Usage: $(basename "$0")"
    abort
}

if [ "$#" -lt 0 ]; then
    err "Illegal number of parameters"
    usage
    abort
fi

if [ "$(uname)" != 'Linux' ]; then
    puts "Not running on linux. aborting"
    abort
fi

sudo apt-get update

if [ ! -f ~/.ssh/known_hosts ]; then
    puts "Creating known_hosts file"
    mkdir -p ~/.ssh/
    touch ~/.ssh/known_hosts
    puts "Done"
fi


if command -v wget > /dev/null 2>&1; then puts "wget is already installed. Skipping..."; else {
  puts "Installing wget..."
  sudo apt-get install -y wget
  puts "Done."
}; fi

# Install docker
if command -v docker > /dev/null 2>&1; then puts "Docker is already installed. Skipping..."; else {
  puts "Installing Docker..."

  sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common

  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

  sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

  sudo apt-get update

  sudo apt-get install -y docker-ce
  sudo usermod -a -G docker $USER
  sudo service docker start
  puts "Done."
}; fi

if command -v docker-compose > /dev/null 2>&1; then puts "Docker-compose is already installed. Skipping..."; else {
    puts "Installing Docker-compose..."
    curl -L https://github.com/docker/compose/releases/download/$DOCKER_COMPOSE_VERSION/docker-compose-Linux-x86_64 | sudo tee /usr/local/bin/docker-compose > /dev/null
    sudo chmod +x /usr/local/bin/docker-compose
    sudo chmod 755 /usr/local/bin/docker-compose
    sudo chown $USER:$USER /usr/local/bin/docker-compose
    puts "Done."
}; fi

if command -v git > /dev/null 2>&1; then puts "Git is already installed. Skipping..."; else {
    puts "Installing Git..."
    sudo apt-get install -y git
    puts "Done."
}; fi

if command -v python > /dev/null 2>&1; then puts "Python is already installed. Skipping..."; else {
    puts "Installing Python..."
    sudo apt-get install -y python
    puts "Done."
}; fi

if command -v make > /dev/null 2>&1; then puts "Make is already installed. Skipping..."; else {
    puts "Installing Make..."
    sudo apt-get install -y make
    puts "Done."
}; fi

if command -v g++ > /dev/null 2>&1; then puts "G++ is already installed. Skipping..."; else {
    puts "Installing G++..."
    sudo apt-get install -y g++
    puts "Done."
}; fi

sudo apt-get install -y build-essential libssl-dev

if command -v nvm > /dev/null 2>&1; then {
    puts "Nvm is already installed. Skipping...";
    nvm install 8.9
} else {
    puts "Installing Nvm..."
    curl https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
    puts "Done."
}; fi

if ! groups | grep -q docker; then
    puts "Please restart the console and run the script again to allow the user group modifications to take place."
    exit 0
fi


pull_and_tag() {
    image=$1
    shortTag=$(echo $image | cut -d":" -f1)
    docker pull $image
    docker tag $image $shortTag
}

puts "Pulling docker images..."
pull_and_tag "hyperledger/fabric-couchdb:$COUCHDB_VERSION" &
pull_and_tag "hyperledger/fabric-ccenv:x86_64-$HYPERLEDGER_VERSION" &
pull_and_tag "hyperledger/fabric-peer:x86_64-$HYPERLEDGER_VERSION" &
pull_and_tag "hyperledger/fabric-orderer:x86_64-$HYPERLEDGER_VERSION" &
pull_and_tag "hyperledger/fabric-tools:x86_64-$HYPERLEDGER_VERSION" &
pull_and_tag "hyperledger/fabric-ccenv:x86_64-$HYPERLEDGER_VERSION" &
pull_and_tag "hyperledger/fabric-baseimage:x86_64-$HYPERLEDGER_BASE_VERSION" &
wait
