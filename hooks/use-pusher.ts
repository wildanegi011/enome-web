"use client";

import { useEffect, useState, useRef } from "react";
import Pusher from "pusher-js";

export const usePusher = (channelName: string, eventName: string, onEvent: (data: any) => void) => {
    const [pusher, setPusher] = useState<Pusher | null>(null);
    const onEventRef = useRef(onEvent);

    // Keep ref updated
    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
            console.warn("Pusher credentials not found in environment variables.");
            return;
        }

        const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        const channel = pusherInstance.subscribe(channelName);
        channel.bind(eventName, (data: any) => {
            onEventRef.current(data);
        });

        setPusher(pusherInstance);

        return () => {
            channel.unbind(eventName);
            pusherInstance.unsubscribe(channelName);
            pusherInstance.disconnect();
        };
    }, [channelName, eventName]); // onEvent removed from dependencies

    return pusher;
};
