/**
 * ConnectionStatusBadge
 *
 * Displays the current WebSocket / real-time connection state.
 *
 * States:
 *   connected=true,  reconnecting=false → green dot  + "Connected"
 *   reconnecting=true                  → amber pulse + "Reconnecting..."
 *   connected=false, reconnecting=false → red dot    + "Disconnected"
 *
 * Requirements: 8.15–8.17
 */
export default function ConnectionStatusBadge({ connected, reconnecting }) {
  if (reconnecting) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Reconnecting...
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        Connected
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-red-500">
      <span className="w-2 h-2 rounded-full bg-red-500" />
      Disconnected
    </div>
  );
}
