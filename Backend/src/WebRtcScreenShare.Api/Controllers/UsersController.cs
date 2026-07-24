using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebRtcScreenShare.Application.Users.Queries;

namespace WebRtcScreenShare.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly GetSharersQueryHandler _getSharersHandler;

    public UsersController(GetSharersQueryHandler getSharersHandler)
    {
        _getSharersHandler = getSharersHandler;
    }

    /// <summary>GET /api/users — Returns all Sharer users. Requires authentication.</summary>
    [HttpGet]
    public async Task<IActionResult> GetSharers()
    {
        var sharers = await _getSharersHandler.HandleAsync();
        return Ok(sharers);
    }
}
