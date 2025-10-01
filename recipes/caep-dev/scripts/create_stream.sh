#!/bin/bash

curl -k --request POST \
  --url https://receiver.dune.com:9043/mgmt/v1.0/receivers/config \
  --header 'Content-Type: application/json' \
  --data '{
	"delivery": {
		"method": "urn:ietf:rfc:8936"
	},
	"events_requested": [
		"https://schemas.openid.net/secevent/caep/event-type/session-revoked",
		"https://schemas.openid.net/secevent/caep/event-type/credential-change"
	],
	"additional_properties": {
		"name": "Receiver CAEP Receiver",
		"authorization_scheme": {
			"spec_urn": "urn:ietf:rfc:6750",
			"attributes": {
				"access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL3ZpdmVrYW50ZW5uYS5pYm0uY29tL3JlY2VpdmVyIiwiZXhwIjoyMTQ3NDgzNjQ3LCJpYXQiOjE3NTkzNDU4MjYsImlzcyI6Imh0dHBzOi8vY2FlcC5kZXYiLCJqdGkiOiJPYm0tenRmYmhSR2dMQ210cmljbDZBPT0iLCJuYmYiOjE3NTkzNDU4MjYsIm9yZ19uYW1lIjoiSUJNIiwic2NvcGVzIjpbInNzZi5tYW5hZ2UiLCJzc2YucmVhZCJdLCJzdWIiOiJzaGFua2FydkBzZy5pYm0uY29tIn0.SaBPRoMe0UvXqfe0awSp5SqsPxFNaRaUUSIvsN9EwMI"
			}
		},
		"metadata_url": "https://ssf.caep.dev/.well-known/ssf-configuration"
	}
}'