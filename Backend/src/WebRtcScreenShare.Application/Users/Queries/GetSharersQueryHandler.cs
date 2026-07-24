using Microsoft.EntityFrameworkCore;
using WebRtcScreenShare.Application.Common.Interfaces;
using WebRtcScreenShare.Application.Users.DTOs;
using WebRtcScreenShare.Domain.Enums;

namespace WebRtcScreenShare.Application.Users.Queries;

public class GetSharersQueryHandler
{
    private readonly IApplicationDbContext _context;

    public GetSharersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>Returns all users who have the Sharer role.</summary>
    public async Task<List<UserDto>> HandleAsync()
    {
        return await _context.Users
            .Where(u => u.Role == UserRole.Sharer)
            .Select(u => new UserDto(u.Id, u.Username, u.Role.ToString()))
            .ToListAsync();
    }
}
