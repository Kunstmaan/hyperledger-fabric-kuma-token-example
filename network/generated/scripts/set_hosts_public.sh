#!/bin/bash
# This file has been auto-generated

# This script automatically adds entries from the /etc/hosts file

sed -i.bak '/orderer.org.kunstmaan.be/d' ~/.ssh/known_hosts && rm ~/.ssh/known_hosts.bak
sudo sed -i.bak '/orderer.org.kunstmaan.be/d' /etc/hosts && sudo rm /etc/hosts.bak
sudo bash -c "echo 34.245.25.66 orderer.org.kunstmaan.be >> /etc/hosts"

sed -i.bak '/kumapeer.org.kunstmaan.be/d' ~/.ssh/known_hosts && rm ~/.ssh/known_hosts.bak
sudo sed -i.bak '/kumapeer.org.kunstmaan.be/d' /etc/hosts && sudo rm /etc/hosts.bak
sudo bash -c "echo 34.245.25.66 kumapeer.org.kunstmaan.be >> /etc/hosts"

sed -i.bak '/tools.org.kunstmaan.be/d' ~/.ssh/known_hosts && rm ~/.ssh/known_hosts.bak
sudo sed -i.bak '/tools.org.kunstmaan.be/d' /etc/hosts && sudo rm /etc/hosts.bak
sudo bash -c "echo 34.245.25.66 tools.org.kunstmaan.be >> /etc/hosts"

sed -i.bak '/authpeer.auth.kunstmaan.be/d' ~/.ssh/known_hosts && rm ~/.ssh/known_hosts.bak
sudo sed -i.bak '/authpeer.auth.kunstmaan.be/d' /etc/hosts && sudo rm /etc/hosts.bak
sudo bash -c "echo 34.240.216.125 authpeer.auth.kunstmaan.be >> /etc/hosts"

