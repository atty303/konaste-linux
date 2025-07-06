#!/bin/bash
wrapper=$(mktemp konaste-gitadora.XXXX.sh)
cleanup() {
  rm -f "$wrapper"
}
trap cleanup EXIT

lutris -b "$wrapper" lutris:konaste-gitadora
echo '"$@"' >>"$wrapper"
"$wrapper" "$@"
