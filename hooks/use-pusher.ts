"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";

export const usePusher = (channelName: string, eventName: string, onEvent: (data: any) => void) => {
    const [pusher, setPusher] = useState<Pusher | null>(null);

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
            onEvent(data);
        });

        setPusher(pusherInstance);

        return () => {
            channel.unbind(eventName);
            pusherInstance.unsubscribe(channelName);
            pusherInstance.disconnect();
        };
    }, [channelName, eventName, onEvent]);

    return pusher;
};
