"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Registered once, before any useGSAP() call. Each effect registers the
// plugins it needs in its own file, so deleting an effect drops its plugin too.
gsap.registerPlugin(useGSAP);

export { gsap, useGSAP };
