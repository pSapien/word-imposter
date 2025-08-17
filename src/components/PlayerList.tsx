import { useEffect, useRef, useState, useCallback, useMemo, useLayoutEffect, forwardRef } from "react";

type Player = { name: string };

type Props = {
  title: string;
  players: Player[];
  userName: string;
  hostName: string;
  eliminated: string[];
  children?: (player: Player) => React.ReactNode;
};


export function PlayerList({
  title,
  players,
  hostName,
  userName,
  children,
  eliminated,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [order, setOrder] = useState(() => players.map((p) => p.name));
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);

  const [itemHeight, setItemHeight] = useState(60);

  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      if (node.offsetHeight > 0 && node.offsetHeight !== itemHeight) {
        setItemHeight(node.offsetHeight);
      }
    }
  }, [itemHeight]);

  const dragState = useRef({ offsetY: 0, rafId: null as number | null }).current;
  const positions = useRef(new Map<string, { top: number; height: number; center: number }>());
  const playersMap = useMemo(() => new Map(players.map((p) => [p.name, p])), [players]);

  useEffect(() => {
    setOrder((prevOrder) => {
      const playerNames = new Set(players.map((p) => p.name));
      const newOrder = prevOrder.filter((name) => playerNames.has(name));
      players.forEach((player) => {
        if (!newOrder.includes(player.name)) {
          newOrder.push(player.name);
        }
      });
      return newOrder;
    });
  }, [players]);

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.height = `${order.length * itemHeight}px`;
    }
  }, [order.length, itemHeight]);

  const playerPositions = useMemo(() => {
    const map = new Map<string, number>();
    order.forEach((name, index) => {
      map.set(name, index * itemHeight);
    });
    return map;
  }, [order, itemHeight]);

  const onDrag = useCallback((e: MouseEvent) => {
    if (dragState.rafId) cancelAnimationFrame(dragState.rafId);
    dragState.rafId = requestAnimationFrame(() => {
      if (!dragging || !containerRef.current) return;
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const newDragY = e.clientY - containerTop - dragState.offsetY;
      setDragY(newDragY);
      const dragCenter = newDragY + itemHeight / 2;
      const newOrder = order.filter(name => name !== dragging);
      let insertIndex = newOrder.length;
      for (let i = 0; i < newOrder.length; i++) {
        const name = newOrder[i];
        const pos = positions.current.get(name);
        if (pos && dragCenter < pos.center) {
          insertIndex = i;
          break;
        }
      }
      newOrder.splice(insertIndex, 0, dragging);
      if (JSON.stringify(newOrder) !== JSON.stringify(order)) {
        setOrder(newOrder);
      }
    });
  }, [dragging, order, dragState, itemHeight]);

  const endDrag = useCallback(() => {
    if (dragState.rafId) {
      cancelAnimationFrame(dragState.rafId);
      dragState.rafId = null;
    }
    setDragging(null);
  }, [dragState]);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag);
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", endDrag);
    };
  }, [dragging, onDrag, endDrag]);

  const startDrag = (e: React.MouseEvent, name: string) => {
    if (e.button !== 0 || !containerRef.current) return;
    e.preventDefault();
    const containerTop = containerRef.current.getBoundingClientRect().top;
    positions.current.clear();
    playerPositions.forEach((top, playerName) => {
      positions.current.set(playerName, {
        top,
        height: itemHeight,
        center: top + itemHeight / 2,
      });
    });
    const initialTop = playerPositions.get(name);
    if (initialTop === undefined) return;
    const mouseYInContainer = e.clientY - containerTop;
    dragState.offsetY = mouseYInContainer - initialTop;
    setDragY(initialTop);
    setDragging(name);
  };

  const draggedPlayer = dragging ? playersMap.get(dragging) : null;

  return (
    <section className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}<span className="text-sm font-normal text-gray-500"> ({players.length})</span></h3>
      <div
        ref={containerRef}
        className="bg-white/60 backdrop-blur-md shadow-lg rounded-xl relative transition-all duration-300"
        style={{ userSelect: dragging ? 'none' : 'auto' }}
      >
        {players.map((player, index) => {
          const name = player.name;
          const isBeingDragged = dragging === name;
          const top = playerPositions.get(name);
          if (top === undefined) return null;

          const isFirstVisible = order[0] === name;
          const isLastVisible = order[order.length - 1] === name;

          return (
            <PlayerItem
              ref={index === 0 ? measuredRef : null}
              key={name}
              player={player}
              isHost={player.name === hostName}
              isCurrentUser={player.name === userName}
              isEliminated={eliminated.includes(player.name)}
              isPlaceholder={isBeingDragged}
              onMouseDown={(e) => startDrag(e, name)}
              style={{ transform: `translateY(${top}px)` }}
              isFirstVisible={isFirstVisible}
              isLastVisible={isLastVisible}
            >
              {children && children(player)}
            </PlayerItem>
          );
        })}
        {draggedPlayer && (
          <div className="absolute top-0 left-0 w-full pointer-events-none" style={{ transform: `translateY(${dragY}px)` }}>
            <PlayerItem
              player={draggedPlayer}
              isHost={draggedPlayer.name === hostName}
              isCurrentUser={draggedPlayer.name === userName}
              isEliminated={eliminated.includes(draggedPlayer.name)}
              isFloating={true}
              isFirstVisible={true}
              isLastVisible={true}
            />
          </div>
        )}
      </div>
    </section>
  );
}

type PlayerItemProps = {
  player: Player, isHost: boolean, isCurrentUser: boolean, isEliminated: boolean,
  isPlaceholder?: boolean, isFloating?: boolean, onMouseDown?: (e: React.MouseEvent) => void,
  children?: React.ReactNode,
  style?: React.CSSProperties,
  isFirstVisible?: boolean,
  isLastVisible?: boolean,
};

const PlayerItem = forwardRef<HTMLDivElement, PlayerItemProps>(({
  player, isHost, isCurrentUser, isEliminated,
  isPlaceholder, isFloating, onMouseDown, children, style,
  isFirstVisible, isLastVisible
}, ref) => {
  return (
    <div
      ref={ref}
      data-player-name={player.name}
      onMouseDown={onMouseDown}
      style={style}
      className={`absolute w-full flex items-center justify-between px-4 py-3 bg-white
        transition-transform duration-300 ease-in-out
        border-b border-gray-200
        ${isFloating ? "opacity-95 scale-[1.03] shadow-lg !rounded-xl z-20" : ""}
        ${isPlaceholder ? "opacity-0 scale-95" : "hover:bg-gray-50"}
        // --- FIX: Apply classes based on props, not pseudo-selectors ---
        ${isFirstVisible ? "rounded-t-xl" : ""}
        ${isLastVisible ? "rounded-b-xl !border-b-0" : ""}
      `}
    >
      <div className="flex items-center gap-2">
        {onMouseDown && (<span className="cursor-grab text-gray-500 hover:text-gray-700 touch-none"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg></span>)}
        <span className={`text-base font-medium text-gray-800 flex items-center space-x-2 ${isEliminated ? "line-through text-gray-500" : ""}`}>
          {player.name}
          {isHost && <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-0.5 mx-1 rounded-full">H</span>}
          {isCurrentUser && <span className="text-xs font-semibold text-black border-black border-2 px-2 py-0.5 mx-1 rounded-full">You</span>}
        </span>
      </div>
      {children}
    </div>
  );
});

PlayerItem.displayName = "PlayerItem";
