#!/bin/bash

ACCESS_TOKEN="NOT_A_VALID_VALUE"
RECEIVER_HOSTNAME="receiver.dune.com"
TRANSMITTER_METADATA_URL="https://transmitter.dune.com:9044/.well-known/ssf-configuration"

payload=$(cat <<EOF
{
	"delivery": {
		"method": "urn:ietf:rfc:8936"
	},
	"events_requested": [
		"https://schemas.openid.net/secevent/caep/event-type/session-revoked",
		"https://schemas.openid.net/secevent/caep/event-type/credential-change"
	],
	"additional_properties": {
		"name": "$RECEIVER_HOSTNAME",
		"authorization_scheme": {
			"spec_urn": "urn:ietf:rfc:6750",
			"attributes": {
				"access_token": "$ACCESS_TOKEN"
			}
		},
		"metadata_url": "$TRANSMITTER_METADATA_URL"
	}
}
EOF
)


curl -k --request POST \
  --url https://$RECEIVER_HOSTNAME:9043/mgmt/v1.0/receivers/config \
  --header 'Content-Type: application/json' \
  --data "$payload"