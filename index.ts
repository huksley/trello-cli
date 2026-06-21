/**
 * Public surface of the Trello wrapper.
 *
 *   import { createTrelloClient } from "@huksley/trello-cli";
 *
 *   const trello = createTrelloClient();              // reads TRELLO_API_KEY + TRELLO_TOKEN
 *   const issues = await trello.listCardsInList(listId);
 *   await trello.addComment(cardId, "on it");
 *   const thread = await trello.getComments(cardId);  // oldest-first
 */

export { TrelloClient, TrelloApiError, createTrelloClient } from "./client.ts";
export type {
  TrelloBoard,
  TrelloList,
  TrelloLabel,
  TrelloCard,
  TrelloComment,
  TrelloMember,
  TrelloCredentials,
  CreateCardInput,
  UpdateCardInput
} from "./types.ts";
