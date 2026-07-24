using WebRtcScreenShare.Domain.Entities;

namespace WebRtcScreenShare.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
