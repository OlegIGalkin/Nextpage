# Nextpage

Split-pane search + AI chat. Click a result to add it as a source; you stay on the results page.

AI chat answers are a small window: a few links, a confident summary, and no next page. Search still has one. Nextpage keeps Google, Bing, or Yandex open beside DeepSeek, ChatGPT, or Perplexity so you can page through live results and feed the chat the URLs, titles, and snippets the model never opened.

The model does not pick the sources. You do.

## How to use

1. Search on the left as you would in a normal browser, including later result pages.
2. Click a result to append it to the chat input. Navigation is cancelled, so you stay on the results list.
3. Ctrl+Click a link to open it in your system browser.
4. Send the prompt from the chat pane as usual (log in to the provider there if you need to).

Toolbar:

| Control | What it does |
| --- | --- |
| **Search Engine** | Google (default), Bing, or Yandex |
| **AI Chat** | Deep Seek (default), Perplexity, or ChatGPT |
| **Search Query >> AI Chat** | Pastes the current query into the chat input |
| **SERP Links >> AI Chat** | Appends every result on the current results page |
| **Flip Browsers** | Swaps the two panes |
| **LLM Language** | Language of the injected source/query text (English by default) |

Redirect URLs from the search engine are resolved to the real page URL before they are inserted.

## What it isn’t

- Not a new model and not a hosted search API.
- Not “search for me”: the chat does not choose what to read; you keep the result list open and choose.
- Not a button inside ChatGPT. It is a desktop window with two real webviews.

## Requirements

- Node.js (current LTS is fine)
- The matching OS (or CI) for packaged installers: Windows for NSIS, macOS for DMG/zip, Linux for AppImage/deb. You can still run from source on any platform with Electron.

## Run from source

```bash
npm install
npm test
npm start
```

`npm start` and `npm run dev` both launch Electron in development mode.

## Packaged installers

Each command generates the app icon, compiles TypeScript, and writes artifacts under `dist/`. Run the Mac and Linux scripts on those OSes (or in CI); `dist:mac` cannot produce a DMG from Windows.

```bash
npm run dist        # same as dist:win — NSIS installer
npm run dist:win
npm run dist:mac    # DMG + zip (arm64 and x64)
npm run dist:linux  # AppImage + deb
npm run dist:all    # all three platforms (fails for targets the host cannot build)
```

## Limitations

The left pane is the real search site; the right pane is the real chat site. Result parsing and chat-input injection depend on those pages’ DOM and will break when they change. Logins, CAPTCHAs, and rate limits are the same as in a normal browser.

## Use cases

The original step-by-step product spec lives in [USECASES.txt](USECASES.txt).

## License

[MIT](LICENSE)
