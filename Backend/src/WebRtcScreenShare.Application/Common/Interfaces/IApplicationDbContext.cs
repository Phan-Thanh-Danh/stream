using Microsoft.EntityFrameworkCore;
using WebRtcScreenShare.Domain.Entities;

namespace WebRtcScreenShare.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
