#!/usr/bin/env bash

# trap ctrl-c and call abort()
trap abort INT

declare -A pid_map

save_pid() { # (description)
    local pid=$!
    local text=$1
    pid_map+=(["$pid"]="$text")
}

kill_pids() {
    for pid in "${!pid_map[@]}"; do
        ps -p $pid > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            kill $pid
        fi
    done
}

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
    kill_pids
    exit 1
}


WAITING_TEXT=""
force_reset_waiting_text() {
    WAITING_TEXT=""
}
mark_waiting() {
    local args="$*"
    local N=4
    if [[ $1 =~ ^-?[0-9]+$ ]]; then
        # $1 is how many dots we print
        N=$1
        args="${*:2}" # Remove the dots from the args
    fi
    local pad=$(( 5 - $N )) # Works only for N from 1 to 4
    local txt
    txt=$(printf '.%.0s' $(eval "echo {1.."$(($N))"}"))$(printf ' %.0s' $(eval "echo {1.."$(($pad))"}"))

    if [ ! -z $WAITING_TEXT ]; then
        err "Error, the waiting text is not empty, meaning a done has been forgotten, or two mark_waiting are consecutive"
        abort
    fi
    WAITING_TEXT="$args"

    >&2 echo -e "[ ${GREEN}${txt}${NC}] $WAITING_TEXT"
}

go_back() {
    # Argument is the number of lines to go back to
    local N=$1
    while [ $N -ge 1 ]; do
        N=$[$N-1]
        >&2 echo -en "\e[0K\r" # Erase line
        >&2 echo -en "\e[1A" # Go back one up
    done
    >&2 echo -en "\e[0K\r" # Erase last line
}

mark_brackets() {
    # If the text starts with a number, assume it's the line number
    if [[ $1 =~ ^[0-9]+$ ]]; then
        # $1 is how many lines do we go back to
        N=$1
        to_display=$2
        args="${*:3}" # remove the number and the bracket text from the args
    else
        N=1
        to_display=$1
        args="${*:2}" # remove the bracket text from the args
    fi
    go_back $N
    >&2 echo -e "[ $to_display ] $args"
}

# This will erase the current line and replace it with done and the text of the args. If you want to create a new line for it, call mark_done_manual_new_line
mark_done_manual() {
    local GREEN='\033[0;32m'
    local NC='\033[0m'
    local to_display="${GREEN}Done${NC}"
    mark_brackets "$to_display" "$*"
}

mark_done_manual_new_line() {
    >&2 echo ""
    mark_done_manual "$*"
}

mark_error_manual() {
    local RED='\033[0;31m'
    local NC='\033[0m'
    local to_display="${RED}Error${NC}"
    mark_brackets "$to_display" "$*"
}

mark_error_manual_new_line() {
    >&2 echo ""
    mark_error_manual "$*"
}

mark_done() {
    mark_done_manual $WAITING_TEXT
    force_reset_waiting_text
}

mark_skip() {
    local YELLOW='\033[0;33m'
    local NC='\033[0m'
    local to_display="${YELLOW}Skip${NC}"
    mark_brackets "$to_display" "$WAITING_TEXT"
    force_reset_waiting_text
}

mark_error() {
    mark_error_manual $WAITING_TEXT
    force_reset_waiting_text
}

# Assuming input is a map where the key is a pid and the value is the text to display
# Displays the text with done if the pid has finished
# Else displays a number of dots changing each time it is called
# Goes back in the output from the number of elements in the map
# Returns true if all processes in the map are done, otherwise returns false
# You must print $(( ${#pid_map[@]} + 1 )) lines the first time you call this otherwise you'll erase previous output
display_pending_processes_status() { # (N_DOTS)
    local N_DOTS=$1
    go_back $(( ${#pid_map[@]}))

    local ALL_FINISHED_FLAG="SET"
    for pid in "${!pid_map[@]}"
    do
        local text="${pid_map[$pid]}"
        # Check if pid is running
        if kill -0 $pid > /dev/null 2>&1; then
            # echo "pid $pid" is running
            # Process is running
            mark_waiting $N_DOTS "$text"
            force_reset_waiting_text # Reset waiting text so we can mark waiting multiple times
            ALL_FINISHED_FLAG=""
        else
            wait $pid
            status=$?
            if [ $status -eq 0 ]; then
                mark_done_manual_new_line "$text"
            else
                mark_error_manual_new_line "$text"
            fi
        fi
    done
    [ ! -z $ALL_FINISHED_FLAG ]
}

wait_for_processes_and_display_status() {
    local N_DOTS=1
    local text
    for text in "${pid_map[@]}";
    do
        mark_waiting $N_DOTS "$text"
        force_reset_waiting_text
    done

    while ! display_pending_processes_status $N_DOTS;
    do
        N_DOTS=$(( ($N_DOTS) % 4 + 1 ))
        sleep 0.75
    done
    pid_map=() # Reset the pids
}

countdown() { # (seconds)
    local sek=$1
    >&2 echo -n "Waiting... $sek"
    while [ $sek -ge 1 ]
    do
        sleep 1
        sek=$[$sek-1]
        >&2 echo -en "\e[0K\rWaiting... $sek"
    done
}
