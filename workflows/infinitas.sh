#!/usr/bin/env -S bash
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

process-compose -f "$script_dir"/infinitas.yaml up

#CONTROLLER_DEVICE=/dev/input/by-id/usb-Konami_Amusement_SOUND_VOLTEX_controller_BF002-joystick
#start_pressed=$(konaste controller read -d $CONTROLLER_DEVICE | jq '.[] | select(.type  == "button" and .number == 0) | .value == 1')
#if [ ! "$start_pressed" = "true" ]; then
#  systemctl poweroff
#fi
