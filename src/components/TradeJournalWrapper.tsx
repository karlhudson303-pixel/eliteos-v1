import React, { useEffect } from "react";
import { useEliteOS } from "../eliteosStore";
import TradeJournal from "./TradeJournal";

export default function TradeJournalWrapper() {
  const loadAll = useEliteOS((s) => s.loadAll);

  // Pull the actual data + actions from the store
  const trades = useEliteOS((s) => s.trades) || [];
  const addTrade = useEliteOS((s) => s.addTrade);
  const deleteTrade = useEliteOS((s) => s.deleteTrade);

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <TradeJournal
      trades={Array.isArray(trades) ? trades : []}
      onAddTrade={addTrade}
      onDeleteTrade={deleteTrade}
    />
  );
}