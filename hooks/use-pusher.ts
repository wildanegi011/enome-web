"use client";

import { useEffect, useState, useRef } from "react";

export const usePusher = (channelName: string, eventName: string, onEvent: (data: any) => void) => {
    const [pusher, setPusher] = useState<any>(null);
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

        let pusherInstance: any = null;
        let channel: any = null;

        const initPusher = async () => {
            try {
                // Dynamic import to reduce bundle size
                const PusherModule = await import("pusher-js");
                const PusherClass = PusherModule.default;
                
                pusherInstance = new PusherClass(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
                    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
                });

                channel = pusherInstance.subscribe(channelName);
                channel.bind(eventName, (data: any) => {
                    onEventRef.current(data);
                });

                setPusher(pusherInstance);
            } catch (error) {
                console.error("Failed to initialize Pusher:", error);
            }
        };

        initPusher();

        return () => {
            if (pusherInstance) {
                if (channel) {
                    channel.unbind(eventName);
                    pusherInstance.unsubscribe(channelName);
                }
                pusherInstance.disconnect();
            }
        };
    }, [channelName, eventName]);

    return pusher;
};
