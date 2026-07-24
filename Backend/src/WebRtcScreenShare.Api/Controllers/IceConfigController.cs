using Microsoft.AspNetCore.Mvc;

namespace WebRtcScreenShare.Api.Controllers;

/// <summary>
/// Returns ICE server configuration (STUN/TURN) to the frontend.
/// Credentials are kept server-side in appsettings — never hardcoded in the client.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class IceConfigController : ControllerBase
{
    private readonly IConfiguration _config;

    public IceConfigController(IConfiguration config)
    {
        _config = config;
    }

    [HttpGet]
    public IActionResult Get()
    {
        var settings = _config.GetSection("IceSettings");

        var stunUrls = settings.GetSection("StunUrls").Get<string[]>() ?? [];
        var turnUrls = settings.GetSection("TurnUrls").Get<string[]>() ?? [];
        var username = settings["TurnUsername"] ?? string.Empty;
        var credential = settings["TurnCredential"] ?? string.Empty;

        var iceServers = new List<object>();

        if (stunUrls.Length > 0)
            iceServers.Add(new { urls = stunUrls });

        if (turnUrls.Length > 0)
            iceServers.Add(new { urls = turnUrls, username, credential });

        return Ok(new { iceServers });
    }
}
