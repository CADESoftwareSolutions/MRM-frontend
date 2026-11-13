import { useCallback } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { DeckOption, MOCK_DECKS } from "../mocks/decks";

export type { DeckOption, DeckType } from "../mocks/decks";

export const deckOptionsQuery = queryOptions({
  queryKey: ["deckOptions"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_DECKS)
  queryFn: async (): Promise<DeckOption[]> => structuredClone(MOCK_DECKS),
  staleTime: Infinity,
});

const NO_DECKS: DeckOption[] = [];

/** Read-only JIB/REV deck list for pickers (invoice coding lines). */
export const useDeckOptions = () => {
  const { data = NO_DECKS, isLoading } = useQuery(deckOptionsQuery);
  const getDeck = useCallback(
    (name: string | null | undefined) => (name ? data.find((deck) => deck.name === name) : undefined),
    [data],
  );
  return { decks: data, loading: isLoading, getDeck };
};

export default useDeckOptions;
