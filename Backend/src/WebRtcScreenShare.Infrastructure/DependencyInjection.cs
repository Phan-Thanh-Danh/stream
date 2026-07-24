using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WebRtcScreenShare.Application.Common.Interfaces;
using WebRtcScreenShare.Infrastructure.Persistence;
using WebRtcScreenShare.Infrastructure.Services;

namespace WebRtcScreenShare.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var useSqlite = string.Equals(
            Environment.GetEnvironmentVariable("USE_SQLITE"), "true",
            StringComparison.OrdinalIgnoreCase);

        if (useSqlite)
        {
            // SQLite — used in Docker (lightweight, no separate DB container)
            var dbPath = Environment.GetEnvironmentVariable("SQLITE_DB_PATH") ?? "/app/data/webrtc.db";
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlite($"Data Source={dbPath}"));
        }
        else
        {
            // SQL Server — used in local development
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));
        }

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        // Services
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();

        return services;
    }
}

