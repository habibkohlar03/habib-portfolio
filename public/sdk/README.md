# Talking Avatar SDK assets

`viseme-model.bin` (the SDK's lip-sync model) belongs in this folder. It is
copied automatically from `node_modules/@interviewflowai/talking-avatar/dist/`
when you run `npm install`, or manually with `npm run sync-sdk`. Commit the file
so Vercel serves it from your own domain at `/sdk/viseme-model.bin`.
