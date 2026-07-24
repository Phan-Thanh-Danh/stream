using Microsoft.EntityFrameworkCore;
using WebRtcScreenShare.Application.Common.Interfaces;
using WebRtcScreenShare.Domain.Entities;
using WebRtcScreenShare.Domain.Enums;

namespace WebRtcScreenShare.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Username).IsRequired().HasMaxLength(100);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        });

        // Seed data — password "password123" hashed with BCrypt-like (SHA256 for demo)
        // In production use BCrypt; here we store bcrypt hashes seeded by code
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Passwords are "password123" — hashed using BCrypt.Net (seeded via HasData)
        // We'll use SHA256 placeholder; actual bcrypt hash is injected via migration
        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "sharer1",
                // BCrypt hash of "password123"
                PasswordHash = "$2a$11$k.Mg5TTgYj3D8UJVx2e8Se/kQEuIRJvMCU0cP8fGPQ7q7USbXxVmK",
                Role = UserRole.Sharer
            },
            new User
            {
                Id = 2,
                Username = "sharer2",
                PasswordHash = "$2a$11$k.Mg5TTgYj3D8UJVx2e8Se/kQEuIRJvMCU0cP8fGPQ7q7USbXxVmK",
                Role = UserRole.Sharer
            },
            new User
            {
                Id = 3,
                Username = "viewer1",
                PasswordHash = "$2a$11$k.Mg5TTgYj3D8UJVx2e8Se/kQEuIRJvMCU0cP8fGPQ7q7USbXxVmK",
                Role = UserRole.Viewer
            },
            new User
            {
                Id = 4,
                Username = "viewer2",
                PasswordHash = "$2a$11$k.Mg5TTgYj3D8UJVx2e8Se/kQEuIRJvMCU0cP8fGPQ7q7USbXxVmK",
                Role = UserRole.Viewer
            }
        );
    }
}
