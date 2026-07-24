using Microsoft.EntityFrameworkCore;
using WebRtcScreenShare.Application.Auth.DTOs;
using WebRtcScreenShare.Application.Common.Interfaces;

namespace WebRtcScreenShare.Application.Auth.Commands;

public class LoginCommandHandler
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<LoginResponse?> HandleAsync(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            return null;

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new LoginResponse(
            Token: token,
            Username: user.Username,
            Role: user.Role.ToString(),
            UserId: user.Id
        );
    }
}
