#!/usr/bin/env bash
set -e -o pipefail

if [ ! -z $VERBOSE ] && [ $VERBOSE -ge 2 ]; then
    set -x
fi

usage() {
    err "Usage: $(basename "$0") command [options]"
    err "commands:"
    err "   * start: starts the blockchain."
    err "            If it was stopped using the stop command, reloads the previously running blockhain."
    err "            If not running previously, will boot the blockchain"
    err "       -e|--erase erases the blockchain and restarts it. LOSS OF DATA WILL OCCUR."
    err "       -r|--restore <path to archive> reloads the blockchain from the archive."
    err "         Will erase any running blockchain. LOSS OF DATA MAY OCCUR for any currently running blockchain."
    err "       -w|--watch enable watch mode on the chaincodes"
    err "       -d|--dynamic when watch mode is enabled, automatically updates chaincodes on file changes"
    err "   * stop: stops the blockchain, can be restarted later with start command without loss of data"
    err "       -e|--erase erases the blockchain. LOSS OF DATA WILL OCCUR."
    err "   * archive: archives the blockchain into a zip file. Can be restored with start --restore <path to archive>"
    err "       -o|--output <folder to the archive> sets where the archive must be saved. The archive name will be blockchain_version_timestamp.tar"
    err "   * update: installs/upgrades/instantiates the chaincodes"
    err "   * -h on any command displays this help"
    abort
}

if [ "$#" -lt 1 ]; then
    err "Illegal number of parameters"
    usage
fi

COMMAND=$1
shift

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
        -w|--watch)
            set -a
            # Every variable set must be exported,
            # This is because the watch command is executed in a subshell
            WATCH_FLAG="SET"
        ;;
        -d|--dynamic)
            WATCH_DYNAMIC_FLAG="SET"
        ;;
        -h|--help)
            INSTALL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
            source $INSTALL_DIR/display_utils.sh
            usage
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


INSTALL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# shellcheck source=/dev/null
source $INSTALL_DIR/display_utils.sh
# shellcheck source=/dev/null
source $INSTALL_DIR/chaincode_utils.sh
source $INSTALL_DIR/.env

realpath() {
  OURPWD=$PWD
  cd "$(dirname "$1")" || exit 1
  LINK=$(readlink "$(basename "$1")")
  while [ "$LINK" ]; do
    cd "$(dirname "$LINK")" || exit 1
    LINK=$(readlink "$(basename "$1")")
  done
  REALPATH="$PWD/$(basename "$1")"
  cd "$OURPWD" || exit 1
  echo "$REALPATH"
}

CHAINCODES_DIR="$(realpath $CHAINCODES_DIR)"
export CHAINCODES_DIR
BUILD_DIR="$(realpath $BUILD_DIR)"
export BUILD_DIR

getMachine() {
    unameOut="$(uname -s)"
    case "${unameOut}" in
        Linux*)     machine=Linux;;
        Darwin*)    machine=Mac;;
        CYGWIN*)    machine=Cygwin;;
        MINGW*)     machine=MinGw;;
        *)          machine="UNKNOWN:${unameOut}"
    esac
    echo "$machine"
}

checkIfFsWatchIsInstalled() {
    if ! command -v fswatch > /dev/null 2>&1; then {
        echo "Installing fswatch..."
        if [ "$(getMachine)" == "Mac" ]; then
            if ! command -v brew > /dev/null 2>&1; then
                >&2 echo "Please install brew and try again"
                >&2 echo "Aborting..."
                exit 1
            fi
            brew install fswatch
        elif [ "$(getMachine)" == "Linux" ]; then
            sudo add-apt-repository ppa:hadret/fswatch
            sudo apt-get update
            sudo apt-get install -y fswatch
        else
            >&2 echo "Sorry, $(getMachine) is not supported."
            >&2 echo "Could not install fswatch"
            >&2 echo "Aborting..."
            exit 1
        fi
        echo "Done."
    }; fi
}

create_chaincode_json() {
    CPWD=$(pwd)

    cd $BUILD_DIR && echo [$(ls -1 -d */ | tr '/' ' ' | while read line ; do echo "\"$line\"," ; done | tr '\n' ' ' | sed 's/, $//')] > chaincodes.json

    cd $CPWD || ( echo "Could not cd into $CPWD"; exit 1 )
}

containsElement () {
  local e match="$1"
  shift
  for e; do [[ "$e" == "$match" ]] && return 0; done
  return 1
}

watch_chaincodes() {
    if [ ! -z "$WATCH_DYNAMIC_FLAG" ]; then
        checkIfFsWatchIsInstalled
    fi

    process_file_update() {
        # Anything running here runs in a subshell
        full_file_path=$1
        modified_file=${full_file_path#"$CHAINCODES_DIR/"}
        chaincode_name=$(echo $modified_file | cut -d"/" -f1)
        chaincode_folder=$CHAINCODES_DIR/$chaincode_name
        if [ ! -d $chaincode_folder ]; then
            # chaincode folder is not a folder, but in fact just a file
            return
        fi
        update_chaincodes "$chaincode_name"
    }
    export -f process_file_update

    update_chaincodes # install chaincodes for the first time.
    while true; do
        if [ ! -z "$WATCH_DYNAMIC_FLAG" ]; then
            echo "Watching for file changes..."
            # Process 1 event at a time
            fswatch -L -1 $CHAINCODES_DIR -e ".*" -i "\\.js$" | xargs -n 1 -P 10 -I {}  bash -c 'process_file_update "$@"' _ {}
        else
            # Use the menu
            chaincodes=( $(cd $CHAINCODES_DIR && echo $(ls -1 -d */ | tr '/' ' ' | while read chaincode ; do echo "$chaincode" ; done | tr '\n' ' ' | sed 's/, $//')) "exit" )
            PS3='Please enter which chaincode to upgrade: '
            select chaincode_name in "${chaincodes[@]}"
            do
                if containsElement "$chaincode_name" "${chaincodes[@]}"; then
                    if [ "$chaincode_name" == "exit" ]; then abort; fi
                    update_chaincodes "$chaincode_name"
                else
                    echo "Invalid choice"
                fi
            done
        fi
    done
}

bump_version() {
    local VERSION=$1
    VERSION=$(echo $VERSION | rev | cut -d'.' -f2- | rev).$(( $(echo $VERSION | rev | cut -d'.' -f1 | rev) +1 ))
    echo "$VERSION"
}

get_version_from_package() {
    local CHAINCODE_PACKAGE_JSON="$1"
    local VERSION=''
    if [ -f "$CHAINCODE_PACKAGE_JSON" ]; then
        # Extract version from package.json
        VERSION=$(grep -o '\"version\":[^,]*' $CHAINCODE_PACKAGE_JSON | cut -d":" -f2 | cut -d'"' -f2)
    fi
    echo "$VERSION"
}

write_version_in_package() {
    local VERSION="$1"
    local CHAINCODE_PACKAGE_JSON="$2"

    if [ -z "$VERSION" ]; then
        err "Ooops... The new version for $CHAINCODE_PACKAGE_JSON is empty, that should not happen"
        abort
    fi

    # Replace the version inside of the file
    if [ "$(getMachine)" == "Mac" ]; then
        sed -i '' -e "s#\(\"version.*\"\).*\"#\1$VERSION\"#" $CHAINCODE_PACKAGE_JSON
    else
        sed -i -e "s#\(\"version.*\"\).*\"#\1$VERSION\"#" $CHAINCODE_PACKAGE_JSON
    fi
}

build_chaincode() {
    local chaincode_name="$1"
    local bump="$2"
    local CHAINCODE_PACKAGE_JSON="$BUILD_DIR/$chaincode_name/package.json"
    # Save the package version currently saved in the BUILD_DIR, if any
    local VERSION
    VERSION=$(get_version_from_package "$CHAINCODE_PACKAGE_JSON")

    # Replace symlinks and move everything to the build folder
    rsync -ra -L -delete $chaincode_name $BUILD_DIR

    # Merge the dependencies of the package.json with the ones from common
    $INSTALL_DIR/merge_deps.py $CHAINCODE_PACKAGE_JSON $BUILD_DIR/$chaincode_name/common/package.json;

    # For watch mode only
    if [ ! -z "$WATCH_FLAG" ] && [ ! -z "$VERSION" ]; then
        if [ ! -z "$bump" ]; then
            # bump the version
            VERSION=$(bump_version $VERSION)
            echo "Upgrading $chaincode_name to version $VERSION"
        fi
        write_version_in_package "$VERSION" "$CHAINCODE_PACKAGE_JSON"
    fi
}

build_chaincodes() {
    increase_version_of_chaincode="$1" # Chaincode for which the version must be increase.

    CPWD=$(pwd)
    cd $CHAINCODES_DIR
    # For each chaincode
    ls -1 -d */ | tr '/' ' ' | while read chaincode_name ; do
        if [ "$chaincode_name" == "$increase_version_of_chaincode" ]; then
            build_chaincode "$chaincode_name" "BUMP"
        else
            build_chaincode "$chaincode_name" ""
        fi
    done
    cd $CPWD || ( echo "Could not cd into $CPWD"; exit 1 )

    # Create the chaincode.json containing the names of the chaincodes
    create_chaincode_json

    echo "*" > "$BUILD_DIR/.gitignore"
}

update_chaincodes() {
    build_chaincodes $1

    docker exec -t $CLI bash -c '/etc/hyperledger/chaincode_tools/update_chaincodes.py --build --forceNpmInstall' &
    save_pid "Installing and updating chaincodes"
    wait
    echo ""
    echo ""
    mark_done "Installing and updating chaincodes"
    #wait_for_processes_and_display_status
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

        rm -rfd $BUILD_DIR
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

    if [ ! -z $WATCH_FLAG ]; then
        $DRYRUN watch_chaincodes
    else
        $DRYRUN update_chaincodes
    fi
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

    # Create build folder before docker starts,
    # otherwise docker will set root permissions on the volume
    mkdir -p "$BUILD_DIR"
    start_blockchain
elif [ $COMMAND = "update" ]; then
    update_chaincodes
elif [ $COMMAND == "archive" ]; then
    archive_blockchain
else
    echo "Unknown command $COMMAND, exiting."
    usage
fi
