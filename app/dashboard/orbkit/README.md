# SHDR-02 / Orbkit

Retrieved with `npx --yes shadcn@latest view zzzzshawn/orbkit/shdr-02` on 2026-10-26. This is the component requested by the user. The project uses npm and JavaScript, so the registry's two TypeScript files were converted using the already-installed Next.js SWC compiler. No runtime dependencies were added; the import alias was made relative.

The registry identifies the Orbkit runtime as MIT-licensed. The SHDR-02 shader is by [XorDev](https://x.com/XorDev) and explicitly says **non-commercial use only, with attribution**. Its original notice is retained, and the orb tooltip credits the artist. This local design preview does not establish permission to use the shader in the commercial course product; obtain that permission or replace the shader before launch.

Local runtime adaptation: an optional `onUnavailable` callback reports unavailable WebGL or shader compilation/link failures so the introduction can show a static fallback. The shader, parameters and Idle/Thinking/Speaking presets are unchanged. GPU resources are released on unmount; upstream supports reduced motion, pausing and adaptive resolution.
