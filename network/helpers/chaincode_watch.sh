#!/usr/bin/env bash


INSTALL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# shellcheck source=/dev/null

# $INSTALL_DIR/blochain_manager.sh start

source $INSTALL_DIR/.env

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

# https://unix.stackexchange.com/questions/146570/arrow-key-enter-menu
# Renders a text based list of options that can be selected by the
# user using up, down and enter keys and returns the chosen option.
#
#   Arguments   : list of options, maximum of 256
#                 "opt1" "opt2" ...
#   Return value: selected index (0 for opt1, 1 for opt2 ...)
function select_option {

    # little helpers for terminal print control and key input
    ESC=$( printf "\033")
    cursor_blink_on()  { printf "$ESC[?25h"; }
    cursor_blink_off() { printf "$ESC[?25l"; }
    cursor_to()        { printf "$ESC[$1;${2:-1}H"; }
    print_option()     { printf "   $1 "; }
    print_selected()   { printf "  $ESC[7m $1 $ESC[27m"; }
    get_cursor_row()   { IFS=';' read -sdR -p $'\E[6n' ROW COL; echo ${ROW#*[}; }
    key_input()        { read -s -n3 key 2>/dev/null >&2
                         if [[ $key = $ESC[A ]]; then echo up;    fi
                         if [[ $key = $ESC[B ]]; then echo down;  fi
                         if [[ $key = ""     ]]; then echo enter; fi; }

    # initially print empty new lines (scroll down if at bottom of screen)
    for opt; do printf "\n"; done

    # determine current screen position for overwriting the options
    local lastrow=`get_cursor_row`
    local startrow=$(($lastrow - $#))

    # ensure cursor and input echoing back on upon a ctrl+c during read -s
    trap "cursor_blink_on; stty echo; printf '\n'; exit" 2
    cursor_blink_off

    local selected=0
    while true; do
        # print options by overwriting the last lines
        local idx=0
        for opt; do
            cursor_to $(($startrow + $idx))
            if [ $idx -eq $selected ]; then
                print_selected "$opt"
            else
                print_option "$opt"
            fi
            ((idx++))
        done

        # user key control
        case `key_input` in
            enter) break;;
            up)    ((selected--));
                   if [ $selected -lt 0 ]; then selected=$(($# - 1)); fi;;
            down)  ((selected++));
                   if [ $selected -ge $# ]; then selected=0; fi;;
        esac
    done

    # cursor position back to normal
    cursor_to $lastrow
    printf "\n"
    cursor_blink_on

    return $selected
}

checkIfFsWatchIsInstalled
ABS_CHAINCODES_DIR="$(realpath $CHAINCODES_DIR)"
export ABS_CHAINCODES_DIR
ABS_BUILD_DIR="$(realpath $BUILD_DIR)"
export ABS_BUILD_DIR
MACHINE=$(getMachine)
export MACHINE


process_file_update() {
    # Anything running here runs in a subshell
    full_file_path=$1
    modified_file=${full_file_path#"$ABS_CHAINCODES_DIR/"}
    chaincode_name=$(echo $modified_file | cut -d"/" -f1)
    chaincode_folder=$ABS_CHAINCODES_DIR/$chaincode_name
    if [ ! -d $chaincode_folder ]; then
        # chaincode folder is not a folder, but in fact just a file
        return
    fi
    echo "Upgrading $chaincode_name"
    sleep 3
    cd $ABS_BUILD_DIR/$chaincode_name && npm --no-git-tag-version version patch  || echo "Error cd into $ABS_BUILD_DIR/$chaincode_name"
}
export -f process_file_update

abort() {
    echo "Aborting..."
    exit 1
}

trap abort INT

# while true; do
#     fswatch -L -1 $ABS_CHAINCODES_DIR -e ".*" -i "\\.js$" | xargs -n 1 -P 10 -I {}  bash -c 'process_file_update "$@"' _ {}
#     echo "Hi"
# done


chaincodes=( "a" "b" )
select_option "${chaincodes[@]}"
