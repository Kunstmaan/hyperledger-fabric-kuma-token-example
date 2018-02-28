#!/bin/bash
# This file has been auto-generated

# This script removes automatically generated entries from the /etc/hosts file

sed -i.bak '/orderer.org.kunstmaan.be/d' ~/.ssh/known_hosts && rm ~/.ssh/known_hosts.bak
sudo sed -i.bak '/orderer.org.kunstmaan.be/d' /etc/hosts && sudo rm /etc/hosts.bak

sed -i.bak '/kumapeer.org.kunstmaan.be/d' ~/.ssh/known_hosts && rm ~/.ssh/known_hosts.bak
sudo sed -i.bak '/kumapeer.org.kunstmaan.be/d' /etc/hosts && sudo rm /etc/hosts.bak

sed -i.bak '/tools.org.kunstmaan.be/d' ~/.ssh/known_hosts && rm ~/.ssh/known_hosts.bak
sudo sed -i.bak '/tools.org.kunstmaan.be/d' /etc/hosts && sudo rm /etc/hosts.bak

sed -i.bak '/authpeer.auth.kunstmaan.be/d' ~/.ssh/known_hosts && rm ~/.ssh/known_hosts.bak
sudo sed -i.bak '/authpeer.auth.kunstmaan.be/d' /etc/hosts && sudo rm /etc/hosts.bak

