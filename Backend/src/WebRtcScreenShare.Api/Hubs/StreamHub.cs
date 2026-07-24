using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace WebRtcScreenShare.Api.Hubs;

/// <summary>
/// StreamHub — handles all WebRTC signaling and presence management.
/// Video data never passes through this hub; only SDP/ICE signals are relayed.
/// </summary>
[Authorize]
public class StreamHub : Hub
{
    // In-memory maps: ConnectionId → UserId/Username, UserId → ConnectionId
    private static readonly ConcurrentDictionary<string, UserInfo> _connections = new();
    private static readonly ConcurrentDictionary<int, string> _userToConnection = new();

    // Track who is currently sharing (UserId → UserInfo)
    private static readonly ConcurrentDictionary<int, UserInfo> _activeSharings = new();

    // ── Connection Lifecycle ──────────────────────────────────────────────────

    public override async Task OnConnectedAsync()
    {
        var user = GetCurrentUser();
        _connections[Context.ConnectionId] = user;
        _userToConnection[user.UserId] = Context.ConnectionId;

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connections.TryRemove(Context.ConnectionId, out var user))
        {
            // Only remove mapping if Context.ConnectionId matches the current active connection for this user
            if (_userToConnection.TryGetValue(user.UserId, out var activeConnId) && activeConnId == Context.ConnectionId)
            {
                _userToConnection.TryRemove(user.UserId, out _);

                if (_activeSharings.TryRemove(user.UserId, out _))
                {
                    await Clients.Others.SendAsync("SharingUserDisconnected", user.UserId, user.Username);
                }
            }

            await Clients.Others.SendAsync("UserDisconnected", user.UserId, user.Username, Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    // ── Presence ──────────────────────────────────────────────────────────────

    /// <summary>Called by the client after connecting to announce presence.</summary>
    public async Task Join()
    {
        var user = GetCurrentUser();
        // Notify all others that this user is online
        await Clients.Others.SendAsync("UserJoined", user.UserId, user.Username, user.Role);

        // Send back the list of currently active sharings to the joining client
        var activeSharings = _activeSharings.Values
            .Select(u => new { u.UserId, u.Username, u.ConnectionId })
            .ToList();

        await Clients.Caller.SendAsync("ActiveSharings", activeSharings);
    }

    // ── Sharing State ─────────────────────────────────────────────────────────

    /// <summary>
    /// Called by a Sharer when they begin sharing their screen.
    /// Notifies all connected Viewers so they can initiate a WebRTC offer.
    /// </summary>
    public async Task StartSharing()
    {
        var user = GetCurrentUser();
        _activeSharings[user.UserId] = user;

        // Notify all Viewers that this Sharer has started sharing
        await Clients.Others.SendAsync("SharerStarted", user.UserId, user.Username, Context.ConnectionId);
    }

    /// <summary>Called by a Sharer when they stop sharing.</summary>
    public async Task StopSharing()
    {
        var user = GetCurrentUser();
        _activeSharings.TryRemove(user.UserId, out _);

        await Clients.Others.SendAsync("SharerStopped", user.UserId, user.Username);
    }

    // ── WebRTC Signaling ──────────────────────────────────────────────────────

    /// <summary>
    /// Viewer → Sharer: Send an SDP Offer to initiate a WebRTC peer connection.
    /// </summary>
    /// <param name="targetConnectionId">The Sharer's SignalR ConnectionId.</param>
    /// <param name="sdpOffer">The SDP offer string from RTCPeerConnection.createOffer().</param>
    public async Task SendOffer(string targetConnectionId, string sdpOffer)
    {
        var caller = GetCurrentUser();
        await Clients.Client(targetConnectionId).SendAsync(
            "ReceiveOffer",
            caller.UserId,
            caller.Username,
            Context.ConnectionId,
            sdpOffer
        );
    }

    /// <summary>
    /// Sharer → Viewer: Send an SDP Answer in response to a Viewer's offer.
    /// </summary>
    /// <param name="targetConnectionId">The Viewer's SignalR ConnectionId.</param>
    /// <param name="sdpAnswer">The SDP answer string from RTCPeerConnection.createAnswer().</param>
    public async Task SendAnswer(string targetConnectionId, string sdpAnswer)
    {
        await Clients.Client(targetConnectionId).SendAsync(
            "ReceiveAnswer",
            Context.ConnectionId,
            sdpAnswer
        );
    }

    /// <summary>
    /// Both sides: Relay an ICE candidate to the peer.
    /// </summary>
    /// <param name="targetConnectionId">The peer's SignalR ConnectionId.</param>
    /// <param name="candidate">JSON serialized RTCIceCandidate.</param>
    public async Task SendIceCandidate(string targetConnectionId, string candidate)
    {
        await Clients.Client(targetConnectionId).SendAsync(
            "ReceiveIceCandidate",
            Context.ConnectionId,
            candidate
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserInfo GetCurrentUser()
    {
        var claims = Context.User!.Claims.ToList();

        var userIdStr = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? claims.FirstOrDefault(c => c.Type == "sub")?.Value
                     ?? "0";

        var username = claims.FirstOrDefault(c => c.Type == "unique_name")?.Value
                    ?? claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Name)?.Value
                    ?? "Unknown";

        var role = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value
                ?? "Sharer";

        return new UserInfo(
            UserId: int.TryParse(userIdStr, out var id) ? id : 0,
            Username: username,
            Role: role,
            ConnectionId: Context.ConnectionId
        );
    }
}

/// <summary>Lightweight record to hold user presence data in memory.</summary>
public record UserInfo(int UserId, string Username, string Role, string ConnectionId);
