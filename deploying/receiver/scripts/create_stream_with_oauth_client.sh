#!/bin/bash

CLIENT_ID="NOT_A_VALID_VALUE"
CLIENT_SECRET="NOT_A_VALID_VALUE"
OIDC_METADATA_URL="https://tenant.verify.ibm.com/oauth2/.well-known/openid-configuration"
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
			"spec_urn": "urn:ietf:rfc:6749",
			"attributes": {
				"grant_type": "client_credentials",
				"client_id": "$CLIENT_ID",
            	"client_secret": "$CLIENT_SECRET",
            	"client_authentication_method": "client_secret_post",
            	"discovery_uri": "$OIDC_METADATA_URL"
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