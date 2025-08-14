type Player = {
  name: string;
};

type Props = {
  title: string;
  players: Player[];
  userName: string;
  hostName: string;
  eliminated: string[];
  children?: (player: Player) => React.ReactNode;
};

export function PlayerList({ title, players, hostName, userName, children, eliminated }: Props) {
  return (
    <section className="max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {title}
        <span className="text-sm font-normal text-gray-500"> ({players.length})</span>
      </h3>

      <div className="bg-white/60 backdrop-blur-md shadow-lg rounded-xl divide-y divide-gray-200">
        {players.map((player, index) => {
          const isHost = player.name === hostName;
          const isCurrentUser = player.name === userName;

          return (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/30 transition rounded-lg"
            >
              <span
                className={`text-base font-medium text-gray-800 flex items-center space-x-2 mx-2 ${
                  eliminated.includes(player.name) ? "line-through text-gray-500" : ""
                }`}
              >
                {player.name}
                {isHost && (
                  <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-0.5 mx-2 rounded-full">H</span>
                )}
                {isCurrentUser && (
                  <span className="text-xs font-semibold text-black border-black border-2 px-2 py-0.5 mx-2 rounded-full">
                    You
                  </span>
                )}
              </span>

              {children && children(player)}
            </div>
          );
        })}
      </div>
    </section>
  );
}
