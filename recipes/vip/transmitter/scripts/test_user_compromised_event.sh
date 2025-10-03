#!/bin/bash

TRANSMITTER_HOSTNAME=transmitter.dune.com

event=$(cat <<EOF
{
    "flow_count": 1,
    "incident_count": 1,
    "incidents_url": "https://console.idprotection.verify.ibm.com/issues?q=status%3AOpen%2Bpb_name%3ACompromised%20User%2Bs_name%3AAnthony.Galiamov%40ibm.com",
    "issue_details_api": "https://console.idprotection.verify.ibm.com/amapi/v1/getIssueDetails?issue_id=185321-1759453163438",
    "issue_id": "185321-1759453163438",
    "issue_keys": {
    "identity_name": "Anthony.Galiamov@ibm.com"
    },
    "issue_time": "2025-10-03T00:52:58Z",
    "issue_type": "Compromised User",
    "message": "Anthony.Galiamov@ibm.com's email address was found in one or more data breaches",
    "playbook_name": "Compromised User",
    "risk": "Critical"
}
EOF
)

echo $event

# Modify the hostname if you aren't using the default transmitter hostname
curl -k --request POST \
    --url https://$TRANSMITTER_HOSTNAME:9042/sources/vip/events \
    --header 'Content-Type: application/json' \
    --data "$event"