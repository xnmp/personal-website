"use client";

import { motion } from "framer-motion";

const links = [
  { label: "GitHub", href: "https://github.com/" },
  { label: "X", href: "https://x.com/" },
  { label: "Email", href: "mailto:hello@chong.md" },
];

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl font-semibold tracking-tight sm:text-6xl"
        >
          Chong
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 max-w-md text-lg leading-relaxed text-zinc-400"
        >
          Engineer building things on the web. More soon.
        </motion.p>

        <motion.ul
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex gap-6 text-sm text-zinc-500"
        >
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="transition-colors hover:text-zinc-100"
              >
                {link.label}
              </a>
            </li>
          ))}
        </motion.ul>
      </div>
    </main>
  );
}
