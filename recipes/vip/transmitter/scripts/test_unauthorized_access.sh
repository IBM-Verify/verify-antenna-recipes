#!/bin/bash

TRANSMITTER_HOSTNAME=transmitter.dune.com

event=$(cat <<EOF
{
    "flow_count": 2,
    "incident_count": 1,
    "incidents_url": "https://console.idprotection.verify.ibm.com/issues?q=status%3AOpen%2Bpb_name%3AAccess%20to%20Unauthorized%20Countries%2Bid%3A183682",
    "issue_details_api": "https://console.idprotection.verify.ibm.com/amapi/v1/getIssueDetails?issue_id=183682-1759257494100",
    "issue_id": "183682-1759257494100",
    "issue_keys": {
    "asset_country_name": "Ukraine",
    "identity_name": "aline.karlovic@authmind.com"
    },
    "issue_time": "2025-09-30T18:26:23Z",
    "issue_type": "Access to Unauthorized Countries",
    "message": "aline.karlovic@authmind.com accessed Ukraine which is flagged as unauthorized",
    "playbook_name": "Access to Unauthorized Countries",
    "risk": "High"
}
EOF
)

echo $event

# Modify the hostname if you aren't using the default transmitter hostname
curl -k --request POST \
    --url https://$TRANSMITTER_HOSTNAME:9042/sources/vip/events \
    --header 'Content-Type: application/json' \
    --data "$event"