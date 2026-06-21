# @huksley/trello-cli

A tiny, dependency-free [Trello REST API](https://developer.atlassian.com/cloud/trello/rest/)
client **and** CLI for Node (uses the global `fetch`, zero runtime dependencies).
It manages **cards** and their **comments**.

> **Vocabulary:** Trello has no "issues". A Trello **card** is the unit of work, so
> here _issue === card_. Cards live in **lists** (their status column) on a **board**.

## Install

```sh
# as a CLI
npm i -g @huksley/trello-cli
trello-cli help

# or run without installing
npx @huksley/trello-cli help

# as a library
npm i @huksley/trello-cli
```

## Auth — you need a key **and** a token

Trello authenticates every request with **two** values:

| value   | env var          | what it is                                 |
| ------- | ---------------- | ------------------------------------------ |
| API key | `TRELLO_API_KEY` | identifies the app/Power-Up                |
| token   | `TRELLO_TOKEN`   | authorises **your** account (read + write) |

A key on its own returns `401` — the token is what grants access to your boards.

**Get them:**

1. **API key** — open <https://trello.com/power-ups/admin>, create (or open) a
   Power-Up, then copy the **API key** from its "API key" tab.
2. **Token** — on that same page click the **Token** link and approve, _or_ visit
   this URL (swap in your key) and approve:

   ```
   https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&name=trello-cli&key=YOUR_API_KEY
   ```

   Copy the token it shows you.

Export both (or put them in a `.env` and load it, e.g. `node --env-file=.env`):

```sh
export TRELLO_API_KEY=...
export TRELLO_TOKEN=...
# optional: export TRELLO_API_BASE_URL=https://api.trello.com/1
```

## CLI

```sh
trello-cli help
trello-cli boards
trello-cli lists  <boardId>      # find list ids (status columns)
trello-cli cards  <boardId>      # list issues on a board
trello-cli card   <cardId>

trello-cli create --list <listId> --name "Fix login bug" --desc "Steps..."
trello-cli move    <cardId> <listId>     # change status column
trello-cli archive <cardId>              # Trello's "close"

trello-cli comment  <cardId> "looking into this"
trello-cli comments <cardId>             # read the thread, oldest first
```

`--label` and `--member` are repeatable on `create`:

```sh
trello-cli create --list <listId> --name "Bug" --label <labelId> --label <labelId> --member <memberId>
```

## Library

```ts
import { createTrelloClient } from "@huksley/trello-cli";

const trello = createTrelloClient(); // reads TRELLO_API_KEY + TRELLO_TOKEN

// Discover ids
const boards = await trello.listBoards();
const lists = await trello.listLists(boards[0].id);

// Manage issues (cards)
const card = await trello.createCard({ idList: lists[0].id, name: "Fix login", desc: "…" });
await trello.moveCard(card.id, anotherListId); // change status
await trello.updateCard(card.id, { name: "Fix login (P1)", due: "2026-07-01T00:00:00Z" });
await trello.archiveCard(card.id); // close

// Comments
await trello.addComment(card.id, "On it.");
const thread = await trello.getComments(card.id); // [{ id, text, date, authorName, … }]
```

Construct it explicitly if you'd rather not use env vars:

```ts
import { TrelloClient } from "@huksley/trello-cli";
const trello = new TrelloClient({ key: "…", token: "…" });
```

## API

`TrelloClient` (and `createTrelloClient()` / `TrelloClient.fromEnv()`):

- **Boards / lists:** `listBoards()`, `listLists(boardId, includeClosed?)`
- **Members / labels:** `getMe()`, `listMembers(boardId)`, `listLabels(boardId)`
- **Cards (issues):** `listCardsOnBoard(boardId, includeClosed?)`,
  `listCardsInList(listId)`, `getCard(cardId)`, `createCard(input)`,
  `updateCard(cardId, changes)`, `moveCard(cardId, listId)`,
  `archiveCard(cardId)`, `unarchiveCard(cardId)`, `deleteCard(cardId)`
- **Comments:** `getComments(cardId, limit?)`, `addComment(cardId, text)`,
  `updateComment(cardId, commentId, text)`, `deleteComment(cardId, commentId)`

Non-2xx responses throw a `TrelloApiError` (`.status`, `.method`, `.path`, `.body`).

## Notes & limits

- **Card vs comment ids:** `archiveCard`/`deleteCard` take a **card** id;
  `updateComment`/`deleteComment` take the **comment** (action) id from `getComments`.
- **Archive vs delete:** `archiveCard` is reversible (`unarchiveCard`); `deleteCard`
  is permanent.
- **Comment paging:** `getComments` fetches up to 1000 (Trello's per-page cap);
  paginating beyond that isn't implemented.
- **Rate limits:** Trello allows ~300 requests / 10s per key and ~100 / 10s per
  token. This wrapper doesn't retry/back off — handle `TrelloApiError` (HTTP 429)
  if you hit them.

## Develop

```sh
npm install
npm run dev -- help        # run the CLI from source (Node 22+; loads .env.development)
npm run typecheck
npm run build              # esbuild → dist/{index,cli}.js + tsc → dist/*.d.ts
```

## License

[MIT](./LICENSE)
