import { useMemo, useState } from "react";
import type { GameDefinition, GameProps } from "../types";
import "./parcel-panic.css";

type Depot = "express" | "library" | "market";

type Parcel = { id: string; label: string; stamp: string; destination: Depot };

const parcels: Parcel[] = [
  { id: "comet", label: "Comet post", stamp: "★", destination: "express" },
  { id: "bookworm", label: "Bookworm bundle", stamp: "☾", destination: "library" },
  { id: "seedling", label: "Seedling crate", stamp: "✦", destination: "market" },
  { id: "corner-shop", label: "Corner shop order", stamp: "★", destination: "express" },
  { id: "midnight", label: "Midnight return", stamp: "☾", destination: "library" },
  { id: "orchard", label: "Orchard basket", stamp: "✦", destination: "market" },
  { id: "archivist", label: "Archivist note", stamp: "☾", destination: "library" },
  { id: "festival", label: "Festival pass", stamp: "★", destination: "express" },
];

const depots: { id: Depot; name: string; stamp: string; description: string }[] = [
  { id: "express", name: "Express truck", stamp: "★", description: "Leaves right away" },
  { id: "library", name: "Library return", stamp: "☾", description: "After-hours returns" },
  { id: "market", name: "Market cart", stamp: "✦", description: "Morning market run" },
];

const hintCopy = [
  "Only the stamp chooses the route. Parcel colour and label are just decoration.",
  "Route guide: ★ goes to Express, ☾ goes to Library, and ✦ goes to Market.",
  "One waiting parcel was routed for you.",
];

function ParcelPanic({ mission, onComplete, disabled = false }: GameProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, Depot>>({});
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [notice, setNotice] = useState("Choose a parcel, then send it to its matching depot.");
  const [finished, setFinished] = useState(false);

  const sortedCount = Object.keys(placements).length;
  const isComplete = sortedCount === parcels.length;
  const score = useMemo(() => {
    const hintDeduction = [0, 0.1, 0.2, 0.3][hintsUsed] ?? 0.3;
    const mistakeDeduction = Math.min(mistakes, 3) * 0.05;
    return Math.max(0, Math.round(mission.maxScore * (1 - hintDeduction - mistakeDeduction)));
  }, [hintsUsed, mission.maxScore, mistakes]);

  function routeSelectedParcel(destination: Depot) {
    if (!selectedId || disabled || finished) return;
    const parcel = parcels.find((item) => item.id === selectedId);
    if (!parcel) return;
    if (parcel.destination !== destination) {
      setMistakes((value) => value + 1);
      setNotice("Route scanner rejected that depot. Check the parcel stamp and try again.");
      return;
    }
    setPlacements((current) => ({ ...current, [parcel.id]: destination }));
    setSelectedId(null);
    setNotice(`${parcel.label} is on its way.`);
  }

  function useHint() {
    if (hintsUsed >= hintCopy.length || disabled || finished) return;
    const nextHint = hintsUsed + 1;
    setHintsUsed(nextHint);
    if (nextHint === 3) {
      const waitingParcel = parcels.find((parcel) => !placements[parcel.id]);
      if (waitingParcel) {
        setPlacements((current) => ({ ...current, [waitingParcel.id]: waitingParcel.destination }));
        setSelectedId(null);
      }
    }
    setNotice(hintCopy[nextHint - 1]);
  }

  function finish() {
    if (!isComplete || disabled || finished) return;
    setFinished(true);
    onComplete({ score, completed: true, details: { hintsUsed, incorrectRoutes: mistakes, parcelsSorted: parcels.length } });
  }

  return (
    <section className="game-shell parcel-panic">
      <div className="game-briefing"><p className="eyebrow">Challenge parcel-panic · dispatch desk</p><h1>{mission.title}</h1><p className="lede">The depot is busy. Sort every parcel by its routing stamp before the delivery carts leave.</p></div>
      <div className="parcel-panic-board">
        <div className="parcel-panic-status"><span><b>{sortedCount}</b> / {parcels.length} sorted</span><span>Projected score <b>{score}</b> pts</span></div>
        <div className="parcel-panic-layout">
          <section className="parcel-panic-queue" aria-label="Parcel queue">
            <div className="parcel-panic-section-heading"><span>Incoming parcels</span><small>Choose one to scan</small></div>
            <div className="parcel-panic-parcels">
              {parcels.map((parcel) => {
                const isSorted = Boolean(placements[parcel.id]);
                const isSelected = selectedId === parcel.id;
                return <button key={parcel.id} type="button" className={`parcel-panic-parcel ${isSelected ? "is-selected" : ""} ${isSorted ? "is-sorted" : ""}`} aria-label={`${parcel.label} parcel`} aria-pressed={isSelected} disabled={disabled || finished || isSorted} onClick={() => { setSelectedId(parcel.id); setNotice(`${parcel.label} is ready to route. Match its stamp.`); }}><span className="parcel-panic-stamp" aria-hidden="true">{parcel.stamp}</span><span>{parcel.label}</span>{isSorted && <small>Routed</small>}</button>;
              })}
            </div>
          </section>
          <section className="parcel-panic-depots" aria-label="Delivery depots">
            <div className="parcel-panic-section-heading"><span>Delivery depots</span><small>Send selected parcel</small></div>
            <div className="parcel-panic-depot-list">
              {depots.map((depot) => <button key={depot.id} type="button" className="parcel-panic-depot" disabled={!selectedId || disabled || finished} onClick={() => routeSelectedParcel(depot.id)}><span className="parcel-panic-depot-stamp" aria-hidden="true">{depot.stamp}</span><span><strong>{depot.name}</strong><small>{depot.description}</small></span><span aria-hidden="true">→</span></button>)}
            </div>
          </section>
        </div>
        <div className="parcel-panic-console" aria-live="polite"><p>{notice}</p><button type="button" className="parcel-panic-hint" disabled={hintsUsed >= hintCopy.length || disabled || finished} onClick={useHint}>{hintsUsed >= hintCopy.length ? "All hints used" : `Use hint ${hintsUsed + 1}`} <span>−{hintsUsed === 0 ? "10" : hintsUsed === 1 ? "20" : "30"}%</span></button></div>
      </div>
      <div className="game-action-row"><span>{isComplete ? "All parcels are routed. Ready to dispatch." : "Route every parcel to unlock dispatch."}</span><button className="button-primary" disabled={!isComplete || disabled || finished} onClick={finish}>{finished ? "Dispatch recorded" : "Dispatch parcels"} <span aria-hidden="true">→</span></button></div>
    </section>
  );
}

export const game: GameDefinition = { slug: "parcel-panic", component: ParcelPanic };
