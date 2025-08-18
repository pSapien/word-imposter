export function CodeWordsSetupPage() {
  return <p>CodeWordsSetupPage</p>;
}

// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import { Card, CardContent, CardHeader } from "../../../components/ui/Card";
// import { Button } from "../../../components/ui/Button";
// import { Input } from "../../../components/ui/Input";
// import { useSocket, useSocketHandler } from "../../../context/SocketContext";
// import { getGameInfo } from "../../game-registry";
// import { cn } from "../../../utils/cn";

// export function CodeWordsSetupPage() {
//   const navigate = useNavigate();
//   const { isConnected, isConnecting, send, currentUserId } = useSocket();

//   const [playerName, setPlayerName] = useState(() => localStorage.getItem("playerName") || "");
//   const [roomCode, setRoomCode] = useState("");
//   const [roomName, setRoomName] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [showCreateRoom, setShowCreateRoom] = useState(false);
//   const [isAuthenticated, setIsAuthenticated] = useState(!!currentUserId);

//   const gameInfo = getGameInfo("codewords")!;

//   // Handle socket messages
//   useSocketHandler((message) => {
//     switch (message.type) {
//       case "login_success":
//         setIsAuthenticated(true);
//         localStorage.setItem("playerName", playerName);
//         toast.success(`Welcome, Agent ${message.payload.profile.displayName}! 🕵️`);
//         break;

//       case "room_created":
//         setIsLoading(false);
//         toast.success("Mission created! 🏠");
//         navigate(`/game/codewords/room/${message.payload.roomCode}`);
//         break;

//       case "room_joined":
//         setIsLoading(false);
//         toast.success("Joined mission! 🎊");
//         navigate(`/game/codewords/room/${message.payload.roomCode}`);
//         break;

//       case "error":
//         setIsLoading(false);
//         toast.error(message.payload.message);
//         break;
//     }
//   });

//   // Check if already authenticated
//   useEffect(() => {
//     if (currentUserId && playerName) {
//       setIsAuthenticated(true);
//     }
//   }, [currentUserId, playerName]);

//   const handleAuth = () => {
//     if (!playerName.trim()) {
//       toast.error("Please enter your agent name");
//       return;
//     }
//     send({
//       type: "login",
//       payload: { displayName: playerName.trim() },
//     });
//   };

//   const handleCreateRoom = () => {
//     if (!isAuthenticated) {
//       handleAuth();
//       return;
//     }
//     if (!roomName.trim()) {
//       toast.error("Please enter a mission name");
//       return;
//     }
//     setIsLoading(true);
//     send({
//       type: "create_room",
//       payload: { gameType: "codewords", roomName: roomName.trim() },
//     });
//   };

//   const handleJoinRoom = () => {
//     if (!isAuthenticated) {
//       handleAuth();
//       return;
//     }
//     if (!roomCode.trim()) {
//       toast.error("Please enter a mission code");
//       return;
//     }
//     setIsLoading(true);
//     send({
//       type: "join_room",
//       payload: { roomCode: roomCode.trim().toUpperCase(), role: "player" },
//     });
//   };

//   return (
//     <div
//       className={cn(
//         "min-h-screen flex items-center justify-center p-4 relative overflow-hidden",
//         "bg-gradient-to-br",
//         gameInfo.color
//       )}
//     >
//       {/* Animated background elements */}
//       <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
//       <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse delay-1000" />
//       <div className="absolute top-1/2 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-500" />

//       {/* Back Button */}
//       <Button
//         onClick={() => navigate("/")}
//         variant="ghost"
//         className="absolute top-4 left-4 text-white hover:bg-white/20"
//       >
//         ← Back to Games
//       </Button>

//       <div className="w-full max-w-md space-y-6">
//         {/* Game Header */}
//         <div className="text-center mb-8">
//           <div className="text-6xl mb-4">{gameInfo.icon}</div>
//           <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">{gameInfo.name}</h1>
//           <p className="text-white/80 text-lg">{gameInfo.description}</p>
//           <div className="flex justify-center space-x-4 mt-4 text-white/70 text-sm">
//             <span>
//               👥 {gameInfo.minPlayers}-{gameInfo.maxPlayers} players
//             </span>
//             <span>⏱️ {gameInfo.estimatedTime}</span>
//           </div>
//         </div>

//         {/* Setup Form */}
//         <Card variant="glass" className="backdrop-blur-xl">
//           <CardHeader>
//             <h2 className="text-2xl font-bold text-gray-800 text-center">Join the Mission! 🕵️</h2>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             {/* Player Name */}
//             <div>
//               <Input
//                 label="Agent Name"
//                 placeholder="Enter your codename"
//                 value={playerName}
//                 onChange={(e) => setPlayerName(e.target.value)}
//                 onKeyPress={(e) => e.key === "Enter" && handleAuth()}
//                 disabled={!isConnected || isAuthenticated}
//               />
//               {isAuthenticated && <p className="text-sm text-green-600 mt-1">✅ Agent {playerName} authenticated</p>}
//             </div>

//             {/* Auth Button */}
//             {!isAuthenticated && (
//               <Button
//                 onClick={handleAuth}
//                 variant="primary"
//                 className="w-full"
//                 disabled={!isConnected || !playerName.trim()}
//               >
//                 Join as Agent {playerName || "Unknown"}
//               </Button>
//             )}

//             {/* Room Actions */}
//             {isAuthenticated && (
//               <div className="space-y-4">
//                 <Button
//                   onClick={() => setShowCreateRoom(!showCreateRoom)}
//                   variant="primary"
//                   className="w-full"
//                   size="lg"
//                 >
//                   🏠 Create New Mission
//                 </Button>

//                 <div className="relative">
//                   <div className="absolute inset-0 flex items-center">
//                     <div className="w-full border-t border-gray-300" />
//                   </div>
//                   <div className="relative flex justify-center text-sm">
//                     <span className="px-2 bg-white text-gray-500">or</span>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <Input
//                     placeholder="Enter mission code (e.g. ABC123)"
//                     value={roomCode}
//                     onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
//                     onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
//                   />
//                   <Button
//                     onClick={handleJoinRoom}
//                     variant="secondary"
//                     className="w-full"
//                     size="lg"
//                     isLoading={isLoading}
//                   >
//                     🚪 Join Mission
//                   </Button>
//                 </div>
//               </div>
//             )}

//             {/* Create Room Form */}
//             {showCreateRoom && isAuthenticated && (
//               <div className="space-y-4 pt-4 border-t border-gray-200">
//                 <Input
//                   label="Mission Name"
//                   placeholder="Enter mission name"
//                   value={roomName}
//                   onChange={(e) => setRoomName(e.target.value)}
//                   onKeyPress={(e) => e.key === "Enter" && handleCreateRoom()}
//                 />
//                 <div className="flex space-x-3">
//                   <Button
//                     onClick={handleCreateRoom}
//                     isLoading={isLoading}
//                     className="flex-1"
//                     disabled={!roomName.trim()}
//                   >
//                     Create Mission
//                   </Button>
//                   <Button onClick={() => setShowCreateRoom(false)} variant="ghost">
//                     Cancel
//                   </Button>
//                 </div>
//               </div>
//             )}

//             {/* Connection Status */}
//             <div className="text-center">
//               <div
//                 className={cn(
//                   "inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm",
//                   isConnected
//                     ? "bg-green-100 text-green-700"
//                     : isConnecting
//                     ? "bg-yellow-100 text-yellow-700"
//                     : "bg-red-100 text-red-700"
//                 )}
//               >
//                 <div
//                   className={cn(
//                     "w-2 h-2 rounded-full",
//                     isConnected ? "bg-green-500" : isConnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"
//                   )}
//                 />
//                 <span>{isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}</span>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Game Rules */}
//         <Card variant="glass" className="backdrop-blur-xl">
//           <CardContent className="p-4">
//             <h3 className="font-semibold text-gray-800 mb-2">Mission Briefing:</h3>
//             <ul className="text-sm text-gray-600 space-y-1">
//               <li>• Two teams: Red and Blue agents</li>
//               <li>• Spymasters give one-word clues</li>
//               <li>• Operatives guess which words belong to their team</li>
//               <li>• Avoid the assassin word at all costs!</li>
//             </ul>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
