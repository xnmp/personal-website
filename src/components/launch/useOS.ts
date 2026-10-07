"use client";

import { useSyncExternalStore } from "react";
import { osFromUserAgent, type OS } from "./platform";

// The user agent never changes during a visit, so there is nothing to subscribe to.
const noSubscribe = () => () => {};
const clientOS = () => osFromUserAgent(navigator.userAgent, navigator.maxTouchPoints);
const serverOS = (): OS | null => null;

/** The visitor's desktop OS, or null on the server, on the first client render,
 * and where no build would install. */
export const useOS = () => useSyncExternalStore(noSubscribe, clientOS, serverOS);
