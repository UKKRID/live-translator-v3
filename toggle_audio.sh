#!/bin/bash
# Toggle audio output between BlackHole and MacBook speakers

current=$(SwitchAudioSource -c)
if echo "$current" | grep -qi "blackhole"; then
    SwitchAudioSource -s "ลำโพง MacBook Pro"
    echo "🔊 กลับไปลำโพง MacBook Pro"
else
    SwitchAudioSource -s "อุปกรณ์สัญญาณออกหลายสัญญาณ"
    echo "🔇 สลับไป BlackHole (สำหรับแปลภาษา)"
fi
