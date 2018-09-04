#!/usr/bin/env bash
set -e -o pipefail

if [ ! -z $VERBOSE ] && [ $VERBOSE -ge 2 ]; then
    set -x
fi


INSTALL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# shellcheck source=/dev/null
source $INSTALL_DIR/display_utils.sh
# shellcheck source=/dev/null
source $INSTALL_DIR/chaincode_utils.sh

usage() {
    err "Usage: $(basename "$0") command [options]"
    err "commands:"
    err "   * start: starts the blockchain."
    err "            If it was stopped using the stop command, reloads the previously running blockhain."
    err "            If not running previously, will boot the blockchain"
    err "       -e|--erase erases the blockchain and restarts it. LOSS OF DATA WILL OCCUR."
    err "       -r|--restore <path to archive> reloads the blockchain from the archive."
    err "         Will erase any running blockchain. LOSS OF DATA MAY OCCUR for any currently running blockchain."
    err "   * stop: stops the blockchain, can be restarted later with start command without loss of data"
    err "       -e|--erase erases the blockchain. LOSS OF DATA WILL OCCUR."
    err "   * archive: archives the blockchain into a zip file. Can be restored with start --restore <path to archive>"
    err "       -o|--output <folder to the archive> sets where the archive must be saved. The archive name will be blockchain_version_timestamp.tar"
    err "   * update: installs/upgrades/instantiates the chaincodes"
    abort
}

if [ "$#" -lt 1 ]; then
    err "Illegal number of parameters"
    usage
fi

COMMAND=$1
shift

CHANNEL_FOLDER="$INSTALL_DIR/../generated/channel"
DOCKER_COMPOSE_FILE="$INSTALL_DIR/../generated/docker/docker-compose.yaml"
CHAINCODES_DIR="../../chaincode/src/chaincodes/"
BUILD_DIR="../build/"

# Add docker-compose to the path
export PATH=$PATH:/usr/local/bin

while :; do
    case $1 in
        -e|--erase)
            KILL_FLAG="SET"
        ;;
        -r|--restore)
            shift
            KILL_FLAG="SET"
            FROM_ARCHIVE_FLAG="SET"
            ARCHIVE=$1
            if [ ! -f $ARCHIVE ]; then
                err "$ARCHIVE does not exist. Please choose a valid archive file."
                abort
            fi
        ;;
        -o|--output)
            shift
            ARCHIVE=$1
            mkdir -p $ARCHIVE
            if [ $? != 0 ]; then
                err "Error while creating archive folder $ARCHIVE"
                abort
            fi
        ;;
        *)
            if [ ! -z $1 ]; then
                err "Unknown option $1"
                usage
            fi
            break
    esac
    shift
done

create_chaincode_json() {
    CPWD=$(pwd)

    cd $BUILD_DIR && echo [$(ls -1 -d */ | tr '/' ' ' | while read line ; do echo "\"$line\"," ; done | tr '\n' ' ' | sed 's/, $//')] > chaincodes.json

    cd $CPWD || ( echo "Could not cd into $CPWD"; exit 1 )
}

build_chaincodes() {
    mkdir -p "$BUILD_DIR"
    # Replace symlinks and move everything to the build folder
    rsync -ra -L -delete "$CHAINCODES_DIR" "$BUILD_DIR"

    create_chaincode_json

    CPWD=$(pwd)
    cd $BUILD_DIR
    ls -1 -d */ | tr '/' ' ' | while read line ; do
        $INSTALL_DIR/merge_deps.py $BUILD_DIR/$line/package.json $BUILD_DIR/$line/common/package.json;
    done
    cd $CPWD || ( echo "Could not cd into $CPWD"; exit 1 )

    echo "*" > "$BUILD_DIR/.gitignore"
}

update_chaincodes() {
    build_chaincodes
    create_chaincode_json

    docker exec -it $CLI /etc/hyperledger/chaincode_tools/update_chaincodes.py --build --forceNpmInstall
    $INSTALL_DIR/clean_old_dockers.py
}

setup_docker_network() {
    # Setup the docker network
    if [ ! "$(docker network ls -q -f name=$HLNETWORK)" ]; then
        mark_waiting "Creating $HLNETWORK docker network"
        $DRYRUN docker network create --driver bridge --subnet=192.168.100.0/24 $HLNETWORK
        mark_done
    else
        mark_waiting "$HLNETWORK docker network is already created"'!'
        mark_done
    fi
}

remove_docker_network() {
    if docker network ls | grep -q $HLNETWORK; then
        mark_waiting "Removing docker network $HLNETWORK..."
        $DRYRUN docker network rm $HLNETWORK
        mark_done
    fi
}

stop_blockchain() {
    if [ ! -z $KILL_FLAG ]; then
        $DRYRUN docker-compose -f $DOCKER_COMPOSE_FILE down
        erase_text="Erasing the blockchain"
        mark_waiting "$erase_text"
        force_reset_waiting_text
        if [ ! -z "$(get_blockchain_containers)" ]; then
            mark_waiting "Removing blockchain containers"
            get_blockchain_containers | while IFS='' read -r line; do
                $DRYRUN docker rm -f "$line"
            done
            mark_done
        fi

        if [ ! -z "$(get_chaincode_containers)" ]; then
            mark_waiting "Removing chaincode containers"
            get_chaincode_containers | while IFS='' read -r line; do
                $DRYRUN docker rm -f "$line"
            done
            mark_done
        fi

        if [ ! -z "$(get_chaincode_images)" ]; then
            mark_waiting "Cleaning chaincode images"
            get_chaincode_images | while IFS='' read -r line; do
                $DRYRUN docker rmi -f "$line"
            done
            mark_done
        fi

        remove_docker_network

        for channel in "${CHANNELS[@]}"
        do
            # Remove the channel blocks so that the channel is recreated next time !
            mark_waiting "Removing $channel.block"
            $DRYRUN rm -f $CHANNEL_FOLDER/$channel.block
            mark_done
        done
        mark_done_manual_new_line "$erase_text"
    else
        mark_waiting "Stopping the blockchain"
        $DRYRUN docker-compose -f $DOCKER_COMPOSE_FILE stop
        if [ ! -z "$(get_chaincode_containers running)" ]; then
            get_chaincode_containers 'running' | while IFS='' read -r line; do
                $DRYRUN docker stop "$line"
            done
        fi
        mark_done
    fi
}

start_blockchain() {
    puts "Starting blockchain..."

    setup_docker_network

    $DRYRUN docker-compose -f $DOCKER_COMPOSE_FILE up -d

    $DRYRUN wait_for_blockchain

    countdown 5
    wait_for_processes_and_display_status

    for channel in "${CHANNELS[@]}"
    do
        mark_waiting "Creating and joining channel $channel"
        $DRYRUN docker exec -t $CLI bash -c "/etc/hyperledger/configtx/create_and_join_channel.sh $channel"
        mark_done
    done

    $DRYRUN update_chaincodes
}

restore_archive_hyperledger_container() {
    peer_or_orderer=$1
    archive_location=$2

    mark_waiting "Restoring $peer_or_orderer"
    $DRYRUN docker cp $archive_location/$peer_or_orderer/production $peer_or_orderer:/var/hyperledger/
    mark_done
}

restore_archive() {
    KILL_FLAG="SET"
    stop_blockchain

    puts "Loading archive from $ARCHIVE..."
    EXTRACT_TARGET=$INSTALL_DIR/tmp

    rm -rfd $EXTRACT_TARGET
    mkdir -p $EXTRACT_TARGET

    tar -xvf $ARCHIVE -C $EXTRACT_TARGET

    setup_docker_network
    docker-compose -f $DOCKER_COMPOSE_FILE up --no-start

        for peer in "${PEERS[@]}"; do
           restore_archive_hyperledger_container $peer $EXTRACT_TARGET/archive
        done

        for orderer in "${ORDERERS[@]}"; do
            restore_archive_hyperledger_container $orderer $EXTRACT_TARGET/archive
        done

    ls -1 $EXTRACT_TARGET/archive/channels/*.block | while IFS='' read -r line; do
        $DRYRUN docker cp $line $CLI:/etc/hyperledger/configtx
    done

    rm -rfd $EXTRACT_TARGET
    puts 'Archive loaded!'
}

archive_hyperledger_container() {
    peer_or_orderer=$1
    raw_save_location=$2
    save_location=$raw_save_location/$peer_or_orderer
    $DRYRUN mkdir -p $save_location

    if is_container_running $peer_or_orderer; then
        mark_waiting "Stopping $peer_or_orderer"
        docker stop $peer_or_orderer
        mark_done
    fi

    mark_waiting "Archiving $peer_or_orderer in $save_location"
    $DRYRUN docker cp $peer_or_orderer:/var/hyperledger/production/ $save_location
    mark_done

    mark_waiting "Restarting $peer_or_orderer"
    $DRYRUN docker start $peer_or_orderer
    mark_done
}

archive_channels() {
    cli=$1
    raw_save_location=$2
    save_location=$raw_save_location/channels
    $DRYRUN mkdir -p $save_location
    docker exec -t $cli bash -c 'ls -1 /etc/hyperledger/configtx/*.block' | while IFS='' read -r line; do
        line=`echo $line | sed 's/\\r//g'`
        $DRYRUN docker cp $cli:$line $save_location
    done
}

archive_blockchain() {
    puts "Archiving blockchain..."
    if ! is_blockchain_running; then
        err "The blockchain is not running"
        abort
    fi

    timestamp=$(date +%s)
    ARCHIVE_TARGET=$INSTALL_DIR/archive

    # Write timestamp
    rm -rfd $ARCHIVE_TARGET
    $DRYRUN mkdir -p $ARCHIVE_TARGET
    if [ -z $DRYRUN ]; then
        echo $timestamp > $ARCHIVE_TARGET/timestamp.txt
    fi

    ###############
    #    Peers    #
    ###############
    for peer in "${PEERS[@]}"; do
       archive_hyperledger_container $peer $ARCHIVE_TARGET
    done
    mark_waiting "Archiving peers"
    mark_done

    ###############
    #   Orderers  #
    ###############
    for orderer in "${ORDERERS[@]}"; do
        archive_hyperledger_container $orderer $ARCHIVE_TARGET
    done
    mark_waiting "Archiving orderers"
    mark_done

    ###############
    #   Channels  #
    ###############
    archive_channels $CLI $ARCHIVE_TARGET
    mark_waiting "Archiving channels"
    mark_done

    ARCHIVE_NAME="blockchain_${VERSION}_${timestamp}.tar"

    FINAL_ARCHIVE_NAME=$ARCHIVE_NAME
    if [ ! -z $ARCHIVE ]; then
        FINAL_ARCHIVE_NAME=$ARCHIVE/$ARCHIVE_NAME
    fi

    RESTORE_HELP="""
You can reload this archive (for version $VERSION) by running the following command:
SuretyAppManager start --blockchain --restore $FINAL_ARCHIVE_NAME
"""

    if [ -z $DRYRUN ]; then
        echo $RESTORE_HELP > $ARCHIVE_TARGET/README.txt
    fi

    cd $INSTALL_DIR || abort
    $DRYRUN tar -cvf $ARCHIVE_NAME archive

    if [ ! -z $ARCHIVE ]; then
        $DRYRUN mv $ARCHIVE_NAME $FINAL_ARCHIVE_NAME
    fi

    mark_waiting "Cleaning temporary files"
    rm -rfd $ARCHIVE_TARGET
    mark_done

    puts "Restarting services..."
    update_chaincodes

    puts "Archive saved in $FINAL_ARCHIVE_NAME"
    puts $RESTORE_HELP
}

if [ $COMMAND == "stop" ]; then
    stop_blockchain
elif [ $COMMAND == "start" ]; then
    if [ ! -z $KILL_FLAG ]; then
        stop_blockchain
    fi

    if [ ! -z $FROM_ARCHIVE_FLAG ]; then
        restore_archive
    fi

    start_blockchain
elif [ $COMMAND = "update" ]; then
    update_chaincodes
elif [ $COMMAND == "archive" ]; then
    archive_blockchain
else
    echo "Unknown command $COMMAND, exiting."
    usage
fi
