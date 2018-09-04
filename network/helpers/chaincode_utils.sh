#!/usr/bin/env bash

# You must source display_utils too for this script to work

CONTAINERS=(tools.org.kunstmaan.be kumapeer.org.kunstmaan.be authpeer.auth.kunstmaan.be orderer.org.kunstmaan.be coudbkuma coudbauth)
PEERS=(kumapeer.org.kunstmaan.be authpeer.auth.kunstmaan.be)
ORDERERS=(orderer.org.kunstmaan.be)
CLI='tools.org.kunstmaan.be'
HLNETWORK='hyperledgerNet'
CHANNELS=(kumachannel)

export CONTAINERS
export PEERS
export CHANNELS
export ORDERERS
export CLI
export HLNETWORK
export CHANNELS

check_if_container_crashed() {
    docker_container=$1
    if docker inspect -f '{{.State.Status}}' $docker_container | grep -q 'exited'; then
        err "Error starting $docker_container"
        echo "Log of $docker_container"
        docker logs $docker_container
        abort
    fi
}

wait_for_container(){
    docker_container=$1

    while ! docker ps --format '{{.Names}}' | grep -q $docker_container;
    do
        sleep 3
    done;

    while docker inspect -f '{{.State.Running}}' $docker_container | grep -q 'false';
    do
        sleep 3;
        check_if_container_crashed $docker_container
    done;
}

get_blockchain_containers() {
    docker ps -a --format '{{.Image}} {{.Names}}' | grep hyperledger | cut -d" " -f2
}

get_chaincode_containers() {
    if [ ! -z $1 ] && [ $1 == 'running' ]; then
        docker ps --format '{{.Names}}' | grep dev-
    else
        docker ps -a --format '{{.Names}}' | grep dev-
    fi
}

get_chaincode_images() {
    docker images --format '{{.Repository}} {{.ID}}' | grep dev- | cut -d" " -f2
}

is_container_running() {
    docker_container=$1
    docker ps --format '{{.Names}}' | grep -qe "^$docker_container$" > /dev/null 2>&1
}

is_blockchain_running() {
    i=0
    while [ $i -lt ${#CONTAINERS[@]} ] && is_container_running ${CONTAINERS[$i]}; do
        i=$[$i+1]
    done
    [ ${#CONTAINERS[@]} == $i ]
}

wait_for_blockchain() {
    for container in "${CONTAINERS[@]}"
    do
       wait_for_container $container &
       save_pid "Waiting for docker container $container"
    done
    wait_for_processes_and_display_status
}
