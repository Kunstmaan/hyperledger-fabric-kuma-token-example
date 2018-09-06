#!/usr/bin/env python2
# Created by Guillaume Leurquin, guillaume.leurquin@accenture.com
"""
This script pulls the latest version of the chaincode, reads $GOPATH/src/chaincodes.json,
and installs/update all the chaincodes according to the config file
"""

import os
import sys
import json
import subprocess
import re
from multiprocessing.pool import ThreadPool
from argparse import ArgumentParser
from argparse import RawTextHelpFormatter

PARSER = ArgumentParser(description="""Instantiates new chaincodes or upgrades existing ones.
Chaincodes should be in $GOPATH/src/chaincodes (optional for nodejs, see below). Supports nodejs and go chaincodes.
The script looks for a file $GOPATH/src/chaincodes.json which must contain the paths to the chaincodes, relative to src/chaincodes/

* For nodejs chaincode only:
    > Compiled Nodejs chaincodes will be in $GOPATH/src/build.
    > If you provide a repository, this will pull from it and save it in $GOPATH/src/, and then run `npm run build`, which must create the $GOPATH/src/build folder, containing chaincodes.
    > If no repository is given, the script will only look in $GOPATH/src/build, making the contents of $GOPATH/src/chaincodes optional.
""", formatter_class=RawTextHelpFormatter)
PARSER.add_argument('--dryrun', help='Shows which commands would be run, without running them', action='store_true')
PARSER.add_argument('--repository', '-r', type=str,help='the repository from which the chaincode should be fetched. If not given, assumes chaincodes are in $GOPATH/src/build/')
PARSER.add_argument('--chaincodeBasePath', '-p', type=str,help='optional path of the chaincodes inside the repository, only needed when a repository is given, default will be the root of the repository. This path is where the package.json or chaincodes.json is.', default='.')
PARSER.add_argument('--forceNpmInstall', '-f', help='forces the script to run npm install on each chaincode. By default it will only run npm install when the node_modules directory for that chaincode is missing', action='store_true')
PARSER.add_argument('--build', '-b', help='chaincode needs to be build first, this will execute "npm run build"', action='store_true')

args = PARSER.parse_args()
DRYRUN = args.dryrun

CHAINCODE_BASE_PATH = os.path.normpath(os.path.join(os.environ['GOPATH'] + '/src', args.chaincodeBasePath))
CHAINCODE_CONF_FILE = CHAINCODE_BASE_PATH + '/build/chaincodes.json'
CONF_IS_JSON_PACKAGE = False

if not os.path.isfile(CHAINCODE_CONF_FILE):
    CONF_FILE = CHAINCODE_BASE_PATH + '/package.json'
    CONF_IS_JSON_PACKAGE = True
else:
    CONF_FILE = CHAINCODE_CONF_FILE

def fail(msg):
    """Prints the error message and exits"""
    sys.stderr.write(msg)
    exit(1)

if not os.path.isfile(CONF_FILE):
    fail('Could not find configuration file {} nor {}'.format(CONF_FILE, CHAINCODE_CONF_FILE))


def call(script, *args):
    """Calls the given script using the args"""

    cmd = script + " " + " ".join(args)
    if DRYRUN:
        print cmd
        return "hi"
    proc = subprocess.Popen("bash -c '" + cmd + "'", stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
    out, error = proc.communicate()
    if proc.returncode != None and proc.returncode != 0:
        print "Error code:" + str(proc.returncode)
        fail("An error occured while executing " + cmd + ". See above for details. Error:\n" + error)
    return out

def is_instantiated_or_installed(data, installed, ignore_version):
    """Checks if the chaincode is installed or instantiated on the channel"""
    chain_info = call(source_peer(data['peer']), "&&", "peer chaincode",
                      "--cafile", data['orderer_ca'],
                      "--orderer", data['orderer_host_port'],
                      "list",
                      ("--installed" if installed else "--instantiated"),
                      "--channelID", data['channel_id'],
                      "--tls true"
                     )

    pattern = "name:[\s\"]" + data['chaincode_name'] + "[,\"]\sversion:[\s\"]" + (".*" if ignore_version else data['chaincode_version']) + "[,\"]\spath:[\s\"]" + data['chaincode_path'] + "[,\"]"
    match_obj = re.search(pattern, chain_info, re.I)
    if match_obj:
        return True
    return False

def is_instantiated(data, ignore_version=False):
    """Checks if the chaincode is instantiated on the channel"""
    return is_instantiated_or_installed(data, False, ignore_version)

def is_installed(data, ignore_version=False):
    """Checks if the chaincode is installed on the channel"""
    return is_instantiated_or_installed(data, True, ignore_version)

def compile_chaincode(data):
    """Compiles the chaincode"""
    if data['chaincode_language'] == "golang":
        call("/etc/hyperledger/chaincode_tools/compile_chaincode.sh", data['chaincode_path'])
        return "---> Compiled " + data['info'] + "!"
    elif data['chaincode_language'] == "node":
        if not os.path.isdir(data['chaincode_path'] + '/node_modules') or args.forceNpmInstall:
            call("npm", "install", "--prefix", data['chaincode_path'])
            return "---> Installed NPM for " + data['info'] + "!"
        return "---> Skipped NPM install for " + data['info'] + "!"

def install_chaincode(data):
    """Installs chaincode on all the peers"""
    if not is_installed(data):
        call(source_peer(data['peer']), "&&", "peer chaincode",
             "--cafile", data['orderer_ca'],
             "--orderer", data['orderer_host_port'],
             "install",
             "--name", data['chaincode_name'],
             "--version", data['chaincode_version'],
             "--path", data['chaincode_path'],
             "--lang", data['chaincode_language']
            )
        return "---> Installed " + data['info'] + " on " + data['peer'] + "!"
    return "---> " + data['info'] + " is already installed on " + data['peer'] + "!"

def source_peer(peer):
    """Sets environment variables for that peer"""
    return "source /etc/hyperledger/crypto-config/tools/set_env." + peer+".sh"

def instantiate_chaincode(data):
    """Instantiates chaincode on one of the peers"""
    info = data['info']

    if not is_instantiated(data):
        upgrade = is_instantiated(data, ignore_version=True)

        policy = ''
        if data['chaincode_policy']:
            info = info + " with policy " + data['chaincode_policy']
            policy = "--policy \"" + data['chaincode_policy'].replace('"', "\\\"").replace("'", "\\\"") + "\""

        call(source_peer(data['peer']), "&&", "peer chaincode",
             "--cafile", data['orderer_ca'],
             "--orderer", data['orderer_host_port'],
             "--logging-level", "debug",
             ("upgrade" if upgrade else "instantiate"),
             "--name", data['chaincode_name'],
             "--version", data['chaincode_version'],
             "--ctor", """\"{\\\"Args\\\":[\\\"Init\\\""""+data['instantiate_args']+"""]}\"""",
             "--channelID", data['channel_id'],
             policy,
             "--tls true",
             "--lang", data['chaincode_language']
            )

        if upgrade:
            return "---> Upgraded " + info + " on " + data['peer'] + "!"
        return "---> Instantiated " + info + " on " + data['peer'] + "!"
    return "---> " + info + " is already instantiated on " + data['peer'] + "!"

def format_args(args):
    """Formats the args with escaped " """
    comma = "," if args else ""
    return comma + ",".join(['\\\"' + a + '\\\"' for a in args])

if not DRYRUN and args.repository:
    # First pull latest version of chaincode:
    subprocess.call("/etc/hyperledger/chaincode_tools/pull_chaincode.sh {0}".format(args.repository), shell=True)

    subprocess.call("npm install --production --prefix " + CHAINCODE_BASE_PATH, shell=True)
    if args.build:
        subprocess.call("npm run build --prefix " + CHAINCODE_BASE_PATH, shell=True)

with open(CONF_FILE) as chaincodes_stream:
    try:
        COMPILE_DATA = []
        INSTALL_DATA = []
        INSTANTIATE_DATA = []
        CHAINCODES_DATA = json.load(chaincodes_stream)
        if CONF_IS_JSON_PACKAGE:
            CHAINCODES_DATA = CHAINCODES_DATA["kuma-hf-chaincode-dev"]["chaincodes"]

        for chaincode_path in CHAINCODES_DATA:
            # Get the absolute path to the chaincode in question
            # it's going to be in the build folder
            absolute_chaincode_path = CHAINCODE_BASE_PATH

            if args.build:
                absolute_chaincode_path = absolute_chaincode_path + "/build/"

            absolute_chaincode_path = absolute_chaincode_path + chaincode_path
            with open(absolute_chaincode_path + "/package.json") as stream:
                try:
                    chaincode = json.load(stream)
                    chaincode_name = chaincode["name"]
                    chaincode_language = chaincode["hf-language"]
                    chaincode_version = chaincode["version"]

                    if chaincode_language == "node":
                        # Path for node must be absolute
                        print "Using node"
                        chaincode_path = absolute_chaincode_path
                    elif chaincode_language == "golang":
                        # Path for golang must be relative to $GOPATH/src
                        chaincode_path = 'chaincodes/' + chaincode_path
                        print "Using go"
                    else:
                        fail("Unknown chaincode language " + chaincode_language + " ! Aborting.")

                    info = "chaincode " + chaincode_name + " version " + chaincode_version + " at " + chaincode_path

                    for net_config in chaincode["hf-network"]:
                        channel_id = net_config["channelId"]
                        instantiate_args = format_args(net_config["instantiateArgs"])
                        chaincode_policy = net_config["endorsementPolicy"] if "endorsementPolicy" in net_config else None
                        orderer_host = net_config["orderer"]["host"]
                        orderer_port = str(net_config["orderer"]["port"])
                        orderer_host_port = orderer_host + ":" + orderer_port
                        orderer_org = net_config["orderer"]["org"]
                        orderer_ca = "/etc/hyperledger/crypto-config/" + orderer_org + "/orderers/" + orderer_host + "/tlsca.combined." + orderer_host + "-cert.pem"

                        the_data = {}
                        for the_peer in net_config["peers"]:
                            the_data = {
                                'peer': the_peer,
                                'info': info,
                                'orderer_ca': orderer_ca,
                                'orderer_host_port': orderer_host_port,
                                'chaincode_name': chaincode_name,
                                'chaincode_version': chaincode_version,
                                'chaincode_path': chaincode_path,
                                'chaincode_policy': chaincode_policy,
                                'instantiate_args': instantiate_args,
                                'channel_id': channel_id,
                                'chaincode_language': chaincode_language
                            }
                            # Compile the chaincode only once
                            if not is_installed(the_data):
                                if not any(d['chaincode_path'] == chaincode_path for d in COMPILE_DATA):
                                    COMPILE_DATA.append(the_data)

                            # Install chaincode on all peers
                            INSTALL_DATA.append(the_data)

                        # Instantiate chaincode on one (the last) of the peers
                        if net_config["peers"]:
                            INSTANTIATE_DATA.append(the_data)
                    print ""

                except ValueError as exc:
                    print exc

        func_mapping = [[compile_chaincode, COMPILE_DATA, "==> COMPILING..."], [install_chaincode, INSTALL_DATA, "==> INSTALLING..."], [instantiate_chaincode, INSTANTIATE_DATA, "==> INSTANTIATING..."]]
        for func, the_data, info in func_mapping:
            print info
            pool = ThreadPool(10)
            results = pool.imap_unordered(func, the_data)
            for result in results:
                print result
            pool.close()
            pool.join()
            print info + "DONE !"

    except ValueError as exc:
        print exc
