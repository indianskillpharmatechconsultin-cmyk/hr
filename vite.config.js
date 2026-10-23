const path = require("node:path");

module.exports = {
  root: path.join(__dirname, "public"),
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: path.join(__dirname, "public", "realtime-client.js"),
      formats: ["es"],
      fileName: () => "realtime.js",
    },
    rollupOptions: {
      output: {
        entryFileNames: "realtime.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
};
