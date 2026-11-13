export type DeckType = "JIB" | "REV";

export interface DeckOption {
  id: string;
  /** "JIB 0142-A" — what an invoice coding line stores. */
  name: string;
  type: DeckType;
  wellLabel: string;
}

export const MOCK_DECKS: DeckOption[] = [
  { id: "deck-jib-0142-a", name: "JIB 0142-A", type: "JIB", wellLabel: "W-0142 Whitfield 1H" },
  { id: "deck-rev-0142-a", name: "REV 0142-A", type: "REV", wellLabel: "W-0142 Whitfield 1H" },
  { id: "deck-jib-0157-a", name: "JIB 0157-A", type: "JIB", wellLabel: "W-0157 Hayes Unit 2H" },
  { id: "deck-rev-0157-a", name: "REV 0157-A", type: "REV", wellLabel: "W-0157 Hayes Unit 2H" },
  { id: "deck-jib-0163-a", name: "JIB 0163-A", type: "JIB", wellLabel: "W-0163 Hayes Unit 3H" },
];
